import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { PersonIcon, LockClosedIcon, SpinnerIcon } from '../Icons';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminLoginModal = ({ isOpen, onClose, onSuccess }: AdminLoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // In a real app, you'd check for custom admin claims after login.
      // App.tsx's onAuthStateChanged listener will handle this check.
      await signInWithEmailAndPassword(auth, email, password);
      // The onSuccess callback will be called from App.tsx after claims are verified.
    } catch (err: any) {
      setError('Invalid credentials or not an admin account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div 
        className="group relative flex w-full max-w-sm flex-col rounded-xl bg-slate-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
        <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
        <div className="relative">
            <button onClick={handleClose} className="absolute -top-2 -right-2 text-slate-400 hover:text-white transition-colors z-20">
              <ion-icon name="close-circle" class="w-8 h-8"></ion-icon>
            </button>

            <h2 className="text-2xl font-bold text-center mb-2 text-indigo-400">Admin Login</h2>
            <p className="text-center text-slate-400 mb-6">Enter your credentials to access the dashboard.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-400">Email</label>
                <div className="relative">
                  <PersonIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5"/>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/50 text-white p-3 pl-10 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="admin@smartpark.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-400">Password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5"/>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 text-white p-3 pl-10 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              {error && <p className="text-pink-500 text-sm text-center -my-2">{error}</p>}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 flex justify-center items-center"
              >
                {isLoading ? <SpinnerIcon className="w-6 h-6"/> : 'Login'}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
