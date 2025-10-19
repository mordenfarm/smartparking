import React from 'react';
import { CarIcon, WalletIcon, LocationIcon, CheckmarkCircleIcon, CloseCircleIcon, ClockIcon } from '../Icons';
import type { User, ParkingLot } from '../../types';

interface HomeScreenProps {
  user: User | null;
  parkingLots: ParkingLot[];
  onFindParking: () => void;
  onEditDetails: () => void;
}

interface InfoCardProps {
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ children, className = "" }) => {
  return (
    <div className={`group relative flex flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20 ${className}`}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"></div>
      <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
};


const HomeScreen = ({ user, parkingLots, onFindParking, onEditDetails }: HomeScreenProps) => {
  const totalSlots = parkingLots.reduce((acc, lot) => acc + lot.slots.length, 0);
  const occupiedSlots = parkingLots.reduce((acc, lot) => acc + lot.slots.filter(s => s.isOccupied).length, 0);

  return (
    <div className="p-4 pt-24 pb-28 space-y-6 overflow-y-auto h-full animate-fade-in">
      {/* Card 1: User Details */}
      <InfoCard className="animate-slide-in-1">
        <h2 className="font-bold text-lg mb-2 text-indigo-400">Your Details</h2>
        {user && (user.carPlate || user.ecocashNumber) ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <CarIcon className="w-5 h-5 text-indigo-300" />
              <p className="text-slate-300">Plate: <span className="font-mono text-white">{user.carPlate || 'Not set'}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <WalletIcon className="w-5 h-5 text-indigo-300" />
              <p className="text-slate-300">Ecocash: <span className="font-mono text-white">{user.ecocashNumber || 'Not set'}</span></p>
            </div>
            <button onClick={onEditDetails} className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Edit Details
            </button>
          </>
        ) : (
          <>
            <p className="text-slate-400 mb-4">Add your car and payment details for quick reservations.</p>
            <button onClick={onEditDetails} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-all">
              Add Details
            </button>
          </>
        )}
      </InfoCard>

      {/* Card 2: Parking Availability */}
      <InfoCard className="animate-slide-in-2">
        <h2 className="font-bold text-lg mb-3 text-indigo-400">Live Availability</h2>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-emerald-400">
              <CheckmarkCircleIcon className="w-8 h-8"/>
              <span className="text-3xl font-bold text-white">{totalSlots - occupiedSlots}</span>
            </div>
            <p className="text-sm text-slate-400">Available</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-pink-500">
              <CloseCircleIcon className="w-8 h-8"/>
              <span className="text-3xl font-bold text-white">{occupiedSlots}</span>
            </div>
            <p className="text-sm text-slate-400">Occupied</p>
          </div>
        </div>
      </InfoCard>

      {/* Card 3: Parking History */}
      <InfoCard className="animate-slide-in-3">
        <h2 className="font-bold text-lg mb-3 text-indigo-400">Recent Parking</h2>
        {user?.reservations && user.reservations.length > 0 ? (
          <div className="space-y-3">
            {user.reservations.slice(0, 2).map(p => (
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
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No recent parking history.</p>
        )}
      </InfoCard>
      
      {/* Card 4: Find Parking */}
      <InfoCard className="animate-slide-in-4 text-center">
         <h2 className="font-bold text-lg mb-2 text-indigo-400">Ready to Park?</h2>
         <p className="text-slate-400 mb-4">Find the nearest available parking spot now.</p>
         <button onClick={onFindParking} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-105">
           Find a Parking Lot
         </button>
      </InfoCard>
    </div>
  );
};

export default HomeScreen;
