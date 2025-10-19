import React from 'react';
import { CheckmarkCircleIcon, CarIcon } from './Icons';

interface ArrivedModalProps {
  isOpen?: boolean; // Keep for optional standalone use
  onClose: () => void;
}

const ArrivedModal = ({ isOpen = true, onClose }: ArrivedModalProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="group relative flex w-full max-w-sm flex-col rounded-xl bg-slate-950 p-6 shadow-2xl mx-auto animate-fade-in-fast"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
      <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
      <div className="relative flex flex-col items-center text-center text-white">
      
          <CarIcon className="w-24 h-24 text-indigo-400" />
          <h2 className="text-2xl font-bold mt-4">You've Arrived!</h2>
          <p className="text-slate-300 mt-2 mb-6">Please proceed to your reserved parking spot.</p>

          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-105"
          >
            <CheckmarkCircleIcon />
            Mark as Parked
          </button>
      </div>
    </div>
  );
};

export default ArrivedModal;