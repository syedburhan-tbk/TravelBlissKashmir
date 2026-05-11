import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { WorkspaceMember, WorkspaceRole, WorkspaceMemberStatus } from '../../types';
import { workspaceService } from '../../services/workspaceService';
import { 
  Users, Search, Filter, MoreVertical, 
  UserPlus, Mail, Shield, AlertCircle, Ban, RefreshCw, Link2
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const { currentWorkspace, currentMemberData, hasRole } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>(WorkspaceRole.VIEWER);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!currentWorkspace) return;
      setIsLoading(true);
      try {
        const data = await workspaceService.getWorkspaceMembers(currentWorkspace.id);
        setMembers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentWorkspace]);

  const loadMembers = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const data = await workspaceService.getWorkspaceMembers(currentWorkspace.id);
      setMembers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    if (!currentWorkspace) return;
    try {
      await workspaceService.inviteMember(currentWorkspace.id, inviteEmail, inviteRole, inviteName);
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole(WorkspaceRole.VIEWER);
      loadMembers();
    } catch (e: any) {
      setInviteError(e.message || 'Failed to send invite');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!currentWorkspace) return;
    await workspaceService.updateMemberRole(currentWorkspace.id, memberId, newRole as WorkspaceRole);
    loadMembers();
  };

  const handleSuspend = async (memberId: string) => {
    if (!currentWorkspace || !window.confirm('Suspend user?')) return;
    await workspaceService.suspendMember(currentWorkspace.id, memberId);
    loadMembers();
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasRole([WorkspaceRole.SUPER_ADMIN, WorkspaceRole.ADMIN])) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Shield size={48} className="mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view User Management.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1115]">Team & Access</h1>
          <p className="text-sm text-slate-500">Manage workspace members, roles, and security.</p>
        </div>
        <button 
          onClick={() => setIsInviteOpen(true)}
          className="bg-[#0F1115] hover:bg-[#C5A059] text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          <UserPlus size={16} /> Invite Member
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex p-12 justify-center items-center">
             <RefreshCw className="animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined/Activity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map(member => (
                  <tr key={member.userId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 bg-[#C5A059]/10 text-[#C5A059]">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select 
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                        disabled={member.userId === currentMemberData?.userId || member.role === WorkspaceRole.SUPER_ADMIN}
                        className="text-xs bg-transparent border-0 font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        {Object.values(WorkspaceRole).map(r => (
                          <option key={r} value={r}>{r.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                        member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                        member.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                       {member.status === 'PENDING' && (
                         <button
                           onClick={() => {
                             const link = `${window.location.origin}/#/signup?workspace=${currentWorkspace?.id}&email=${encodeURIComponent(member.email)}`;
                             navigator.clipboard.writeText(link);
                             alert('Invite link copied!');
                           }}
                           className="text-slate-400 hover:text-[#C5A059] p-2"
                           title="Copy Invite Link"
                         >
                           <Link2 size={14} />
                         </button>
                       )}
                       {(member.userId !== currentMemberData?.userId && member.role !== WorkspaceRole.SUPER_ADMIN) && (
                          <button 
                            onClick={() => handleSuspend(member.userId)}
                            className="text-red-500 hover:text-red-700 p-2"
                            title="Suspend User"
                          >
                            <Ban size={14} />
                          </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Invite Team Member</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4 text-sm">
              {inviteError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} />
                  <span>{inviteError}</span>
                </div>
              )}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Name</label>
                <input required type="text" value={inviteName} onChange={e=>setInviteName(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#C5A059]" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Email</label>
                <input required type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#C5A059]" placeholder="john@agency.com" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Role</label>
                <select value={inviteRole} onChange={e=>setInviteRole(e.target.value as WorkspaceRole)} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#C5A059]">
                  {Object.values(WorkspaceRole).filter(r => r !== WorkspaceRole.SUPER_ADMIN).map(r => (
                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsInviteOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#0F1115] text-white rounded-xl font-medium flex items-center gap-2 justify-center hover:bg-[#C5A059] transition-colors">
                  <Mail size={16} /> Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
