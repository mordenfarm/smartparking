import React, { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { User, Reservation, ParkingLot } from '../../types';
import {
  BarChartIcon,
  CashIcon,
  DocumentTextIcon,
  LayersIcon,
  LogOutIcon,
  PersonIcon,
  SpinnerIcon,
  TrendingUpIcon,
} from '../Icons';
import ViewAllUsersModal from './ViewAllUsersModal';
import ManageParkingModal from './ManageParkingModal';
import UserDetailModal from './UserDetailModal';
import { generateReport } from '../../services/reportGenerator';

// Card component for dashboard items
const StatCard = ({ icon, title, value, detail }: { icon: React.ReactNode, title: string, value: string, detail?: string }) => (
    <div className="group relative flex flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"></div>
      <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
      <div className="relative">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 p-3 rounded-lg">{icon}</div>
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        </div>
        {detail && <p className="text-xs text-slate-500 mt-2">{detail}</p>}
      </div>
    </div>
);

// AdminDashboard component
const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isParkingModalOpen, setIsParkingModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const unsubscribers = [
      onSnapshot(collection(db, 'users'), snapshot => {
        setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as User[]);
      }, err => setError("Failed to load users.")),
      onSnapshot(collection(db, 'reservations'), snapshot => {
        setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reservation[]);
      }, err => setError("Failed to load reservations.")),
      onSnapshot(collection(db, 'parkingLots'), snapshot => {
        setParkingLots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ParkingLot[]);
      }, err => setError("Failed to load parking lots.")),
    ];
    
    // Using a timeout to give snapshots time to load, then stop loading spinner.
    const timer = setTimeout(() => setIsLoading(false), 1500);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearTimeout(timer);
    };

  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIsUsersModalOpen(false); // Close list modal when detail is opened
  };

  const handleCloseUserDetail = () => {
    setSelectedUser(null);
  };
  
  const handleGenerateReport = () => {
    try {
        generateReport(reservations, users, parkingLots);
    } catch(e) {
        alert("Failed to generate report. Make sure you are online and try again.");
        console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <SpinnerIcon className="w-12 h-12 text-indigo-400" />
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
        <p className="text-xl text-pink-500 mb-4">An Error Occurred</p>
        <p className="text-slate-400 text-center">{error}</p>
      </div>
    );
  }

  const totalRevenue = reservations.reduce((sum, res) => sum + res.amountPaid, 0);
  const totalSlots = parkingLots.reduce((sum, lot) => sum + lot.slots.length, 0);
  const occupiedSlots = parkingLots.reduce((sum, lot) => sum + lot.slots.filter(s => s.isOccupied).length, 0);
  const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <header className="p-4 flex justify-between items-center bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-indigo-400">Admin Dashboard</h1>
        <button onClick={onLogout} className="flex items-center gap-2 bg-pink-600/80 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          <LogOutIcon />
          Logout
        </button>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<CashIcon className="w-6 h-6 text-white"/>} title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
          <StatCard icon={<BarChartIcon className="w-6 h-6 text-white"/>} title="Total Reservations" value={reservations.length.toString()} />
          <StatCard icon={<PersonIcon className="w-6 h-6 text-white"/>} title="Registered Users" value={users.length.toString()} />
          <StatCard icon={<TrendingUpIcon className="w-6 h-6 text-white"/>} title="Current Occupancy" value={`${occupancyRate.toFixed(1)}%`} detail={`${occupiedSlots} / ${totalSlots} slots`} />
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={() => setIsParkingModalOpen(true)} className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors border border-slate-800 hover:border-indigo-500">
            <LayersIcon className="w-10 h-10 text-indigo-400 mb-2"/>
            <span className="font-semibold">Manage Parking Lots</span>
          </button>
          <button onClick={() => setIsUsersModalOpen(true)} className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors border border-slate-800 hover:border-indigo-500">
            <PersonIcon className="w-10 h-10 text-cyan-400 mb-2"/>
            <span className="font-semibold">View All Users</span>
          </button>
          <button onClick={handleGenerateReport} className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors border border-slate-800 hover:border-indigo-500">
            <DocumentTextIcon className="w-10 h-10 text-emerald-400 mb-2"/>
            <span className="font-semibold">Generate PDF Report</span>
          </button>
        </div>
      </main>
      
      <ManageParkingModal 
        isOpen={isParkingModalOpen}
        onClose={() => setIsParkingModalOpen(false)}
        parkingLots={parkingLots}
        onSave={() => { /* Real-time listener will update UI */ }}
      />
      
      <ViewAllUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        users={users}
        onSelectUser={handleSelectUser}
      />

      {selectedUser && (
        <UserDetailModal
            isOpen={!!selectedUser}
            onClose={handleCloseUserDetail}
            user={selectedUser}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
