import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDocs, query, collectionGroup, where, writeBatch, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { TeamMember, UserRole } from '../types';

enum OperationType {
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: User | null;
  userProfile: TeamMember | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, email: string | null, displayName: string | null, photoURL: string | null) => {
    try {
      const docRef = doc(db, 'users', uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        return;
      }

      if (docSnap.exists()) {
        const data = docSnap.data() as TeamMember;
        const isSuperAdminEmail = email?.toLowerCase() === 'syd.burhan.smb@gmail.com';
        if (isSuperAdminEmail) {
          data.role = UserRole.ADMIN;
          data.isApproved = true;
        }
        setUserProfile(data);
      } else {
        // Create default profile
        const isSuperAdmin = email?.toLowerCase() === 'syd.burhan.smb@gmail.com';
        const newProfile: TeamMember & { uid: string, createdAt: string } = {
          id: uid,
          uid: uid,
          name: displayName || email?.split('@')[0] || 'User',
          role: isSuperAdmin ? UserRole.ADMIN : UserRole.SALES,
          title: isSuperAdmin ? 'CEO & Founder' : 'Travel Expert',
          avatar: photoURL || 'https://ui-avatars.com/api/?name=User',
          email: email || '',
          phone: '',
          location: 'Srinagar',
          color: 'bg-blue-100 text-blue-700',
          isApproved: isSuperAdmin,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(docRef, newProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
          return;
        }
        setUserProfile(newProfile);
      }

      // Automatically accept any pending workspace invites for this email
      if (email) {
        try {
          // Check if there are explicit URL parameters telling us which workspace they were invited to
          let explicitlyInvitedWorkspaceId: string | null = null;
          const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
          if (hashParams.get('workspace')) {
             explicitlyInvitedWorkspaceId = hashParams.get('workspace');
          }

          const pendingId = "pending_" + email.toLowerCase();
          
          const memberDocsToProcess: any[] = [];
          
          if (explicitlyInvitedWorkspaceId) {
             const docSnap = await getDoc(doc(db, `workspaces/${explicitlyInvitedWorkspaceId}/members/${pendingId}`));
             if (docSnap.exists() && docSnap.data().status === 'PENDING') {
                memberDocsToProcess.push({
                   ref: docSnap.ref,
                   data: docSnap.data(),
                   workspaceId: explicitlyInvitedWorkspaceId
                });
             }
          }

          // We execute this even if memberDocsToProcess length is 0 in case there are multiple, but collectionGroup query might fail without an index.
          // By adding this try/catch specifically around the collectionGroup, it won't break the explicit invite above.
          try {
             const membersRef = collectionGroup(db, 'members');
             const q = query(membersRef, where('email', '==', email));
             const snapshot = await getDocs(q);
             snapshot.forEach(memberDoc => {
               const memberData = memberDoc.data();
               if (memberData.status !== 'PENDING') return;
               const parentPath = memberDoc.ref.parent.parent;
               if (parentPath && !memberDocsToProcess.find(m => m.workspaceId === parentPath.id)) {
                 memberDocsToProcess.push({
                    ref: memberDoc.ref,
                    data: memberData,
                    workspaceId: parentPath.id
                 });
               }
             });
          } catch(e) {
             console.log("Collection group query for pending invites failed (likely needs index):", e);
          }
          
          if (memberDocsToProcess.length > 0) {
            const batch = writeBatch(db);
            const workspacesToJoin: string[] = [];
            
            memberDocsToProcess.forEach(memberDoc => {
               workspacesToJoin.push(memberDoc.workspaceId);
               // Delete pending
               batch.delete(memberDoc.ref);
               // Create actual member record
               const newMemberRef = doc(db, `workspaces/${memberDoc.workspaceId}/members`, uid);
               batch.set(newMemberRef, {
                 ...memberDoc.data,
                 userId: uid,
                 status: 'ACTIVE',
                 joinedAt: new Date().toISOString()
               });
            });

            // Update user profile workspaces
            const globalUserRef = doc(db, 'users', uid);
            const gSnap = await getDoc(globalUserRef);
            if (gSnap.exists()) {
               const gData = gSnap.data();
               const existingWs = gData.workspaces || [];
               batch.update(globalUserRef, {
                  workspaces: [...new Set([...existingWs, ...workspacesToJoin])]
               });
            }

            await batch.commit();
          }
        } catch (e) {
          console.error("Failed to process pending invites", e);
        }
      }

    } catch (error) {
      console.error("Error in fetchProfile flow:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as TeamMember);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser.email, currentUser.displayName, currentUser.photoURL);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with Email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing up with Email:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
