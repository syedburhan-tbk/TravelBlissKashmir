import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { BRAND_CONFIG } from '../constants';
import { Mountain, AlertCircle } from 'lucide-react';

const SignUp: React.FC = () => {
  const { user, signUpWithEmail, loading } = useAuth();
  const [error, setError] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone || !password) {
      setError('Please enter both email/phone and password.');
      return;
    }
    try {
      setError('');
      setIsSubmitting(true);
      
      let authEmail = emailOrPhone;
      const phoneRegex = /^\+?[\d\s-]+$/;
      if (phoneRegex.test(emailOrPhone)) {
        authEmail = `${emailOrPhone.replace(/[\s-]/g, '')}@travelblisskashmir-phone.in`;
      }

      await signUpWithEmail(authEmail, password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled. Please go to the Firebase Console -> Authentication -> Sign-in method, and enable "Email/Password".');
      } else {
        setError(err.message || 'Failed to sign up. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
             <Mountain size={32} className="text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Join the {BRAND_CONFIG.name} CRM
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-3">
             <AlertCircle size={18} />
             {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailSignUp}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-2">Email address or Phone</label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 transition-all font-medium"
                placeholder="you@example.com or +919876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium text-slate-500">
           Already have an account? <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-500 focus:outline-none focus:underline transition-all">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
