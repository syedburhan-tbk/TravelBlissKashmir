import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp, writeBatch, documentId } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Workspace, WorkspaceMember, WorkspaceRole, WorkspaceMemberStatus, GlobalUser, ActivityLog } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const workspaceService = {
  
  // Creates a new workspace and sets the current user as SUPER_ADMIN
  async createWorkspace(name: string): Promise<Workspace> {
    if (!auth.currentUser) throw new Error("Must be logged in");
    const userId = auth.currentUser.uid;
    const email = auth.currentUser.email || "";
    const displayName = auth.currentUser.displayName || email.split('@')[0];

    const workspaceRef = doc(collection(db, 'workspaces'));
    const workspaceId = workspaceRef.id;

    const workspace: Workspace = {
      id: workspaceId,
      name,
      ownerId: userId,
      createdAt: new Date().toISOString()
    };

    const member: WorkspaceMember = {
      userId,
      email,
      name: displayName,
      role: WorkspaceRole.SUPER_ADMIN,
      status: WorkspaceMemberStatus.ACTIVE,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    const globalUserRef = doc(db, 'users', userId);

    try {
      const batch = writeBatch(db);
      
      // 1. Create Workspace
      batch.set(workspaceRef, workspace);
      
      // 2. Add member
      const memberRef = doc(db, `workspaces/${workspaceId}/members`, userId);
      batch.set(memberRef, member);
      
      // 3. Ensure global user profile exists and has this workspace
      const userSnap = await getDoc(globalUserRef);
      if (!userSnap.exists()) {
        const newUser: GlobalUser = {
          uid: userId,
          email,
          name: displayName,
          workspaces: [workspaceId],
          createdAt: new Date().toISOString()
        };
        batch.set(globalUserRef, newUser);
      } else {
        const existingData = userSnap.data() as GlobalUser;
        const currentWorkspaces = existingData.workspaces || [];
        if (!currentWorkspaces.includes(workspaceId)) {
          batch.update(globalUserRef, {
            workspaces: [...currentWorkspaces, workspaceId]
          });
        }
      }

      await batch.commit();
      
      await this.logActivity(workspaceId, userId, 'Created Workspace', 'Workspace');

      return workspace;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `workspaces/${workspaceId}`);
      throw e;
    }
  },

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    try {
      const globalUserRef = doc(db, 'users', userId);
      const userSnap = await getDoc(globalUserRef);
      if (!userSnap.exists()) return [];

      const workspaceIds = (userSnap.data() as GlobalUser).workspaces || [];
      if (workspaceIds.length === 0) return [];

      const promises = workspaceIds.map(id => 
        getDoc(doc(db, 'workspaces', id)).catch(err => {
          console.warn(`Could not fetch workspace ${id}:`, err);
          return null;
        })
      );
      const docs = await Promise.all(promises);
      
      return docs.filter(d => d && d.exists()).map(d => d!.data() as Workspace);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'workspaces');
      return [];
    }
  },

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const q = collection(db, `workspaces/${workspaceId}/members`);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as WorkspaceMember);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `workspaces/${workspaceId}/members`);
      return [];
    }
  },

  async inviteMember(workspaceId: string, email: string, role: WorkspaceRole, name: string): Promise<void> {
    if (!auth.currentUser) throw new Error("Must be logged in");
    try {
      // Use the email directly (encoded) as the pending ID so we can easily find it on signup
      const memberId = "pending_" + email.toLowerCase(); 
      const memberRef = doc(db, `workspaces/${workspaceId}/members`, memberId);
      
      const newMember: WorkspaceMember = {
        userId: memberId,
        email: email.toLowerCase(),
        name,
        role,
        status: WorkspaceMemberStatus.PENDING,
        joinedAt: new Date().toISOString()
      };
      
      await setDoc(memberRef, newMember);

      // Queue the email for Firebase Trigger Email Extension
      const mailRef = doc(collection(db, 'mail'));
      const inviteLink = `${window.location.origin}/#/signup?workspace=${workspaceId}&email=${encodeURIComponent(email)}`;
      await setDoc(mailRef, {
        to: email,
        message: {
          subject: `${auth.currentUser.displayName || 'Someone'} invited you to join their workspace`,
          html: `
            <h2>You've been invited!</h2>
            <p>You have been invited to join a team workspace on Travel CRM as a <strong>${role.replace('_', ' ')}</strong>.</p>
            <p>Click the link below to accept the invite and set up your account:</p>
            <a href="${inviteLink}" style="display:inline-block;padding:10px 20px;background:#0F1115;color:#fff;text-decoration:none;border-radius:8px;">Accept Invitation</a>
          `
        }
      });

      await this.logActivity(workspaceId, auth.currentUser.uid, `Invited user ${email}`, 'WorkspaceMember');
    } catch (e) {
       handleFirestoreError(e, OperationType.CREATE, `workspaces/${workspaceId}/members`);
    }
  },

  async updateMemberRole(workspaceId: string, memberId: string, newRole: WorkspaceRole): Promise<void> {
    if (!auth.currentUser) throw new Error("Must be logged in");
    try {
      const memberRef = doc(db, `workspaces/${workspaceId}/members`, memberId);
      await updateDoc(memberRef, { role: newRole });
      await this.logActivity(workspaceId, auth.currentUser.uid, `Updated role for ${memberId} to ${newRole}`, 'WorkspaceMember');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `workspaces/${workspaceId}/members/${memberId}`);
    }
  },

  async suspendMember(workspaceId: string, memberId: string): Promise<void> {
    if (!auth.currentUser) throw new Error("Must be logged in");
    try {
      const memberRef = doc(db, `workspaces/${workspaceId}/members`, memberId);
      await updateDoc(memberRef, { status: WorkspaceMemberStatus.SUSPENDED });
      await this.logActivity(workspaceId, auth.currentUser.uid, `Suspended member ${memberId}`, 'WorkspaceMember');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `workspaces/${workspaceId}/members/${memberId}`);
    }
  },
  
  async getActivityLogs(workspaceId: string): Promise<ActivityLog[]> {
    try {
      const q = collection(db, `workspaces/${workspaceId}/activity_logs`);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ActivityLog).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `workspaces/${workspaceId}/activity_logs`);
      return [];
    }
  },

  async logActivity(workspaceId: string, userId: string, action: string, resource: string): Promise<void> {
    try {
      const logRef = doc(collection(db, `workspaces/${workspaceId}/activity_logs`));
      const logData: ActivityLog = {
        id: logRef.id,
        userId,
        workspaceId,
        action,
        resource,
        timestamp: new Date().toISOString()
      };
      await setDoc(logRef, logData);
    } catch (e) {
      console.error("Failed to write to activity log", e);
      // Don't throw to prevent blocking main actions
    }
  }
};
