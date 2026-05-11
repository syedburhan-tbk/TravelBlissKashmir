
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Camera, 
  Check, 
  Shield, 
  Mail, 
  Loader2, 
  CheckCircle2,
  Trash2,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

enum OperationType {
  UPDATE = 'update',
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
    authInfo: null, 
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

const ProfileSettings: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    avatar: '',
    phone: '',
    location: '',
  });

  useEffect(() => {
    if (userProfile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: userProfile.name || '',
        title: userProfile.title || '',
        avatar: userProfile.avatar || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
      });
    }
  }, [userProfile]);

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
      </div>
    );
  }

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);

    try {
      // Update Firestore user document
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        name: formData.name,
        title: formData.title,
        avatar: formData.avatar,
        phone: formData.phone,
        location: formData.location
      });
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: formData.name,
        photoURL: formData.avatar
      });

      await refreshProfile();
      
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      setIsSaving(false);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">My Profile</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage your personal settings, contact details, and display picture.</p>
        </div>
        <div className="flex items-center gap-4">
          {showSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-in fade-in slide-in-from-right-2">
              <CheckCircle2 size={18} />
              Profile Updated
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[48px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row gap-12 items-center md:items-start bg-slate-50/50">
           <div className="relative group shrink-0">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-[40px] overflow-hidden border-8 border-white shadow-xl bg-slate-100">
                 {formData.avatar ? (
                   <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                     <User size={48} />
                   </div>
                 )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-4 rounded-3xl shadow-xl hover:scale-110 transition-transform active:scale-95"
              >
                 <Camera size={20}/>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
           </div>
           
           <div className="flex-1 space-y-2 mt-4 md:mt-6 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{userProfile.name}</h2>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Shield size={16} /> {userProfile.role}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="flex items-center gap-1.5"><Mail size={16} /> {userProfile.email}</span>
              </div>
           </div>
        </div>

        <form onSubmit={handleSave} className="p-10 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                 <input 
                   required type="text" 
                   className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all" 
                   value={formData.name} 
                   onChange={e => setFormData({...formData, name: e.target.value})} 
                 />
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Job Title / Designation</label>
                 <input 
                   type="text" 
                   className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all" 
                   value={formData.title} 
                   onChange={e => setFormData({...formData, title: e.target.value})} 
                 />
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</label>
                 <input 
                   type="tel" 
                   className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all" 
                   value={formData.phone} 
                   onChange={e => setFormData({...formData, phone: e.target.value})} 
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Location / Branch</label>
                 <input 
                   type="text" 
                   className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all" 
                   value={formData.location} 
                   onChange={e => setFormData({...formData, location: e.target.value})} 
                 />
              </div>
           </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;

