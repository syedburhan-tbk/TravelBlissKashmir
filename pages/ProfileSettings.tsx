
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Camera, 
  Check, 
  Shield, 
  Mail, 
  Briefcase, 
  Loader2, 
  CheckCircle2,
  Trash2,
  Smartphone,
  MapPin,
  Mountain,
  Plus,
  X,
  Edit2,
  Search,
  Users
} from 'lucide-react';
import { UserRole, TeamMember } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

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
    authInfo: null, // Basic auth info won't be used directly here to avoid extra imports, it's enough to catch it
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

const ProfileSettings: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<TeamMember>>(() => ({
    name: '',
    title: '',
    role: UserRole.SALES,
    avatar: 'https://picsum.photos/seed/' + Math.random() + '/100/100',
    email: '',
    phone: '',
    location: 'Srinagar Office',
    color: 'bg-emerald-600'
  }));

  if (userProfile && userProfile.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
         <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
            <Shield size={40} />
         </div>
         <h2 className="text-3xl font-black text-slate-900 mb-4">Admin Access Required</h2>
         <p className="text-slate-500 font-medium max-w-md">You do not have the required administrative privileges to view or manage the agency staff profiles.</p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      title: '',
      role: UserRole.SALES,
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
      email: '',
      phone: '',
      location: 'Srinagar Office',
      color: 'bg-emerald-600'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({ ...member });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (members.length <= 1) {
      alert("At least one member must remain in the system.");
      return;
    }
    if (window.confirm("Permanently delete this member profile?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        fetchMembers();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const roleColors: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'bg-blue-600',
      [UserRole.SALES]: 'bg-emerald-600',
      [UserRole.OPERATIONS]: 'bg-amber-600'
    };

    const newId = editingMember?.id || `tm-${Date.now()}`;
    const memberData: TeamMember = {
      ...formData,
      id: newId,
      color: roleColors[formData.role as UserRole] || 'bg-slate-600'
    } as TeamMember;

    try {
      await setDoc(doc(db, "users", newId), memberData);
      
      if (userProfile && userProfile.id === newId) {
        await refreshProfile();
      }

      await fetchMembers();
      
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsModalOpen(false);
      }, 1000);
    } catch (error) {
      setIsSaving(false);
      handleFirestoreError(error, OperationType.WRITE, `users/${newId}`);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Team & Workspace</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage agency staff, roles, and internal identity profiles.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-900/20 transition-all active:scale-95"
        >
          <Plus size={18} /> New Team Profile
        </button>
      </div>

      {isLoadingMembers ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map(member => (
            <div key={member.id} className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:border-blue-100 transition-all relative">
               <div className={`h-24 ${member.color} transition-colors duration-500`} />
               
               <div className="px-8 pb-8">
                  <div className="relative -mt-12 mb-6">
                     <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-white shadow-xl bg-slate-50 mx-auto relative">
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                     </div>
                     <div className={`absolute top-0 right-1/2 translate-x-12 -translate-y-2 p-1.5 rounded-full border-2 border-white ${member.isApproved ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900'} shadow-md`} title={member.isApproved ? "Approved Account" : "Pending Approval"}>
                        {member.isApproved ? <Check size={12} strokeWidth={4} /> : <div className="w-3 h-3 rounded-full animate-pulse" />}
                     </div>
                  </div>

                  <div className="text-center space-y-1 mb-8">
                     <h3 className="text-xl font-black text-slate-900 leading-tight">{member.name}</h3>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{member.title}</p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50">
                     <div className="flex items-center gap-3 text-slate-500">
                        <div className="p-2 bg-slate-50 rounded-xl"><Shield size={14} className="text-slate-400"/></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{member.role}</span>
                     </div>
                     <div className="flex items-center gap-3 text-slate-500">
                        <div className="p-2 bg-slate-50 rounded-xl"><Mail size={14} className="text-slate-400"/></div>
                        <span className="text-[10px] font-bold truncate">{member.email}</span>
                     </div>
                  </div>

                  <div className="flex gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-all">
                     <button 
                       onClick={() => handleOpenEdit(member)}
                       className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all"
                     >
                        Modify
                     </button>
                     <button 
                       onClick={() => handleDelete(member.id)}
                       className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                     >
                        <Trash2 size={18}/>
                     </button>
                  </div>
               </div>
            </div>
          ))}

          <button 
            onClick={handleOpenAdd}
            className="border-4 border-dashed border-slate-200 rounded-[48px] flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/20 transition-all h-[400px]"
          >
             <div className="p-6 bg-slate-50 rounded-full group-hover:bg-white transition-colors">
                <Plus size={48} />
             </div>
             <span className="font-black uppercase tracking-[0.3em] text-xs">Register Profile</span>
          </button>
        </div>
      )}

      {/* Profile Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
             <div className="bg-slate-950 p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                   <div className="bg-blue-600 p-3 rounded-2xl">
                      {editingMember ? <Edit2 size={24}/> : <User size={24}/>}
                   </div>
                   <div>
                      <h2 className="text-xl font-black tracking-tight uppercase">{editingMember ? 'Modify Team Member' : 'Register New Member'}</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal Access Configuration</p>
                   </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
             </div>

             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                   {/* Left Col: Photo */}
                   <div className="md:col-span-4 flex flex-col items-center space-y-6">
                      <div className="relative group">
                         <div className="w-48 h-48 rounded-[56px] overflow-hidden border-8 border-slate-50 shadow-2xl bg-slate-100">
                            <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                         </div>
                         <button 
                           type="button"
                           onClick={() => fileInputRef.current?.click()}
                           className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-4 rounded-3xl shadow-xl hover:scale-110 transition-transform active:scale-95"
                         >
                            <Camera size={20}/>
                         </button>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Portrait Dimensions 1:1 Recommended</p>
                   </div>

                   {/* Right Col: Fields */}
                   <div className="md:col-span-8 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Member Name</label>
                            <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-900 outline-none focus:ring-8 focus:ring-blue-50/50 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Access Role</label>
                            <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs outline-none cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                               {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                         </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <input 
                           type="checkbox" 
                           id="isApproved" 
                           className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                           checked={formData.isApproved || false} 
                           onChange={e => setFormData({...formData, isApproved: e.target.checked})} 
                         />
                         <label htmlFor="isApproved" className="text-sm font-bold text-slate-700">Account Approved (Allow login)</label>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Job Title</label>
                            <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Primary Base</label>
                            <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact Email</label>
                            <input required type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Work Phone</label>
                            <input required type="tel" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                         </div>
                      </div>
                   </div>
                </div>
             </form>

             <div className="p-8 border-t border-slate-50 flex gap-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 rounded-3xl transition-all">Cancel</button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-[2] py-5 bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                   {isSaving ? <Loader2 size={24} className="animate-spin" /> : showSuccess ? <CheckCircle2 size={24}/> : <Check size={24}/>}
                   {isSaving ? 'Syncing Team Data...' : showSuccess ? 'Success' : editingMember ? 'Commit Changes' : 'Onboard Member'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
