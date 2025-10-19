import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { PersonIcon, LockClosedIcon, GoogleLogoIcon, SpinnerIcon } from './Icons';

interface LoginModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LoginModal = ({ isOpen = true, onClose, onSuccess }: LoginModalProps) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div 
      className="group relative flex w-full max-w-sm flex-col rounded-xl bg-slate-950 p-6 shadow-2xl animate-fade-in-fast"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
      <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
      <div className="relative text-white">
        {onClose && (
            <button onClick={onClose} className="absolute -top-2 -right-2 text-slate-400 hover:text-white transition-colors z-20">
                <ion-icon name="close-circle" class="w-8 h-8"></ion-icon>
            </button>
        )}

        <h2 className="text-2xl font-bold text-center mb-2 text-indigo-400">{isLoginView ? 'Login' : 'Sign Up'} to Reserve</h2>
        <p className="text-center text-slate-400 mb-6">Please {isLoginView ? 'login or sign up' : 'create an account'} to continue.</p>
        
        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <div className="relative">
              <PersonIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5"/>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-900/50 text-white p-3 pl-10 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
            </div>
          </div>
          <div>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5"/>
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-900/50 text-white p-3 pl-10 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading ? <SpinnerIcon className="w-5 h-5"/> : (isLoginView ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-slate-700" />
          <span className="mx-4 text-slate-500 text-sm">OR</span>
          <hr className="flex-grow border-slate-700" />
        </div>

        <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? <SpinnerIcon className="w-5 h-5"/> : <><GoogleLogoIcon /> Continue with Google</>}
        </button>
        
        <p className="text-center text-sm text-slate-400 mt-6">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-indigo-400 hover:underline ml-1">
            {isLoginView ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
  
  return (
     <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {content}
    </div>
  )
};

export default LoginModal;
