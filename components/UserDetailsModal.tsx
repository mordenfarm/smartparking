import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { CarIcon, WalletIcon } from './Icons';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { carPlate: string; ecocashNumber: string }) => void;
  user: User | null;
}

const UserDetailsModal = ({ isOpen, onClose, onSave, user }: UserDetailsModalProps) => {
  const [carPlate, setCarPlate] = useState('');
  const [ecocashNumber, setEcocashNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCarPlate(user?.carPlate || '');
      setEcocashNumber(user?.ecocashNumber || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ carPlate, ecocashNumber });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="group relative flex w-full max-w-sm flex-col rounded-xl bg-slate-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
        <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
        <div className="relative">
            <button onClick={onClose} className="absolute -top-2 -right-2 text-slate-400 hover:text-white transition-colors z-20">
              <ion-icon name="close-circle" class="w-8 h-8"></ion-icon>
            </button>

            <h2 className="text-2xl font-bold text-center mb-2 text-indigo-400">Your Details</h2>
            <p className="text-center text-slate-400 mb-6">Enter your vehicle and payment information.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-400">Car Number Plate</label>
                <div className="relative">
                  <CarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5"/>
                  <input 
                    type="text" 
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900/50 text-white p-3 pl-10 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="AEF-123"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-400">Ecocash Number</label>
                <div className="relative">
                  <WalletIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5"/>
                  <input 
                    type="tel"
                    value={ecocashNumber}
                    onChange={(e) => setEcocashNumber(e.target.value)}
                    className="w-full bg-slate-900/50 text-white p-3 pl-10 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="0777123456"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-105"
              >
                Save Details
              </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;