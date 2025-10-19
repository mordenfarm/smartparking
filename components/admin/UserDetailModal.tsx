import React from 'react';
import type { User, Reservation } from '../../types';
import { PersonIcon, CarIcon, WalletIcon, ClockIcon, LocationIcon } from '../Icons';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const UserDetailModal = ({ isOpen, onClose, user }: UserDetailModalProps) => {
  if (!isOpen || !user) return null;
  
  // In a full app, user.reservations would be populated by a separate query
  const reservations: Reservation[] = (user as any).parkingHistory || user.reservations || [];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="group relative flex w-full max-w-lg flex-col rounded-xl bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
        <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
        <div className="relative p-6 text-white">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20">
              <ion-icon name="close-circle" class="w-8 h-8"></ion-icon>
            </button>

            <h2 className="text-2xl font-bold text-center mb-6 text-indigo-400">User Details</h2>
            
            <div className="bg-slate-900/50 p-4 rounded-lg space-y-3 mb-6">
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-slate-400"><PersonIcon className="w-5 h-5"/> Username</span>
                    <span className="font-semibold">{user.username}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-slate-400"><CarIcon className="w-5 h-5"/> Car Plate</span>
                    <span className="font-mono text-cyan-400">{user.carPlate}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-slate-400"><WalletIcon className="w-5 h-5"/> Ecocash</span>
                    <span className="font-mono">{user.ecocashNumber}</span>
                </div>
            </div>

            <h3 className="font-bold text-lg text-indigo-400 mb-3">Parking History</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {reservations.length > 0 ? (
                    reservations.map(p => (
                        <div key={p.id} className="bg-slate-900/50 p-3 rounded-lg">
                            <div className="flex items-center gap-3 mb-1">
                                <LocationIcon className="w-5 h-5 text-indigo-300"/>
                                <p className="font-semibold text-white">{p.parkingLotName} - Slot {p.slotId.toUpperCase()}</p>
                            </div>
                            <div className="flex justify-between text-sm text-slate-400">
                                <div className="flex items-center gap-2"><ClockIcon/>{p.durationHours} hours</div>
                                <div className="flex items-center gap-2"><WalletIcon/>${p.amountPaid.toFixed(2)}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-400 text-center py-4">No parking history found for this user.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
