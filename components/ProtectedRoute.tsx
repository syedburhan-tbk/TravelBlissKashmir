import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Clock8 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { user, userProfile, loading, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile) {
    const isSuperAdminEmail = user?.email?.toLowerCase() === 'syd.burhan.smb@gmail.com';
    const isApproved = userProfile.isApproved || isSuperAdminEmail;

    if (!isApproved) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-xl">
           <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock8 size={32} />
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-2">Pending Verification</h2>
           <p className="text-slate-500 font-medium leading-relaxed mb-8">
             Your account '{userProfile.email}' is waiting for admin approval. You will gain access once verified.
           </p>
           <button 
             onClick={signOut}
             className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 mx-auto"
           >
              <LogOut size={18} />
              Sign Out
           </button>
        </div>
      </div>
    );
    }
  }

  return <Outlet />;
};
