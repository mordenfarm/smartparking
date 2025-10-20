import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { User, Reservation } from '../../types';
import { PersonIcon, CarIcon, WalletIcon, ClockIcon, LocationIcon, SpinnerIcon } from '../Icons';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const UserDetailModal = ({ isOpen, onClose, user }: UserDetailModalProps) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      const fetchReservations = async () => {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, 'reservations'),
            where('userId', '==', user.uid),
            orderBy('startTime', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const userReservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reservation[];
          setReservations(userReservations);
        } catch (error) {
          console.error("Error fetching user reservations: ", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReservations();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

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
            <div className="flex items-center gap-3">
              <PersonIcon className="w-5 h-5 text-indigo-300" />
              <p><span className="text-slate-400">Username:</span> <span className="font-semibold">{user.username}</span></p>
            </div>
             <div className="flex items-center gap-3">
              <PersonIcon className="w-5 h-5 text-indigo-300" />
              <p><span className="text-slate-400">Email:</span> <span className="font-semibold">{user.email}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <CarIcon className="w-5 h-5 text-cyan-400" />
              <p><span className="text-slate-400">Car Plate:</span> <span className="font-mono">{user.carPlate || 'Not Set'}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <WalletIcon className="w-5 h-5 text-emerald-400" />
              <p><span className="text-slate-400">Ecocash:</span> <span className="font-mono">{user.ecocashNumber || 'Not Set'}</span></p>
            </div>
          </div>
          
          <h3 className="font-bold text-lg text-indigo-400 mb-3">Reservation History ({reservations.length})</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <SpinnerIcon className="w-8 h-8 text-indigo-400" />
                </div>
            ) : reservations.length > 0 ? (
                reservations.map(res => (
                    <div key={res.id} className="bg-slate-900/50 p-3 rounded-lg">
                        <div className="flex items-center gap-3 mb-1">
                            <LocationIcon className="w-5 h-5 text-indigo-300"/>
                            <p className="font-semibold">{res.parkingLotName} - Slot {res.slotId.toUpperCase()}</p>
                        </div>
                        <div className="flex justify-between text-sm text-slate-400">
                           <p>{res.startTime.toDate().toLocaleString()}</p>
                           <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1"><ClockIcon/>{res.durationHours}h</div>
                             <div className="flex items-center gap-1"><WalletIcon/>${res.amountPaid.toFixed(2)}</div>
                           </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-slate-400 text-center py-8">This user has no reservation history.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
