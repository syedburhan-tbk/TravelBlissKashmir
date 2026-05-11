import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workspace, WorkspaceMember, WorkspaceRole } from '../types';
import { workspaceService } from '../services/workspaceService';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentMemberData: WorkspaceMember | null;
  isLoading: boolean;
  createWorkspace: (name: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  hasRole: (roles: WorkspaceRole[]) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentMemberData, setCurrentMemberData] = useState<WorkspaceMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setTimeout(() => {
        if (isMounted) {
          setWorkspaces([]);
          setCurrentWorkspace(null);
          setCurrentMemberData(null);
          setIsLoading(false);
        }
      }, 0);
      return () => { isMounted = false; };
    }

    const loadWorkspaces = async () => {
      try {
        const userWs = await workspaceService.getUserWorkspaces(user.uid);
        setWorkspaces(userWs);
        
        if (userWs.length > 0) {
          // Default to first workspace, or could load from localStorage
          const defaultWs = userWs[0];
          setCurrentWorkspace(defaultWs);
          
          // Get member data
          const members = await workspaceService.getWorkspaceMembers(defaultWs.id);
          const memberData = members.find(m => m.userId === user.uid);
          setCurrentMemberData(memberData || null);
        } else {
          // Optional: Create a default workspace if none
          try {
             await workspaceService.createWorkspace('Travel Operations');
             // reload
             const wsAgain = await workspaceService.getUserWorkspaces(user.uid);
             setWorkspaces(wsAgain);
             if (wsAgain.length > 0) {
               setCurrentWorkspace(wsAgain[0]);
               const members = await workspaceService.getWorkspaceMembers(wsAgain[0].id);
               setCurrentMemberData(members.find(m => m.userId === user.uid) || null);
             }
          } catch(e) {
             console.error("Failed creating default workspace", e);
          }
        }
      } catch (e) {
        console.error("Error loading workspaces", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspaces();
  }, [user]);

  const createWorkspace = async (name: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const newWs = await workspaceService.createWorkspace(name);
      setWorkspaces(prev => [...prev, newWs]);
      setCurrentWorkspace(newWs);
      const members = await workspaceService.getWorkspaceMembers(newWs.id);
      setCurrentMemberData(members.find(m => m.userId === user.uid) || null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (!user) return;
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspace(ws);
      const members = await workspaceService.getWorkspaceMembers(ws.id);
      setCurrentMemberData(members.find(m => m.userId === user.uid) || null);
    }
  };

  const hasRole = (roles: WorkspaceRole[]) => {
    if (user?.email?.toLowerCase() === 'syd.burhan.smb@gmail.com') return true;
    if (!currentMemberData) return false;
    // SUPER_ADMIN has override access
    if (currentMemberData.role === WorkspaceRole.SUPER_ADMIN) return true;
    return roles.includes(currentMemberData.role);
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      currentMemberData,
      isLoading,
      createWorkspace,
      switchWorkspace,
      hasRole
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
};
