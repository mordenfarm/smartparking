import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { WeeklyReservations, RevenueData, ParkingLot, User, Reservation } from '../../types';
import { BarChartIcon, LineChartIcon, TrendingUpIcon, ConstructIcon, DocumentTextIcon, PersonIcon, SpinnerIcon } from '../Icons';
import ManageParkingModal from './ManageParkingModal';
import UserDetailModal from './UserDetailModal';

// Because recharts is loaded via CDN, we need to declare it to TypeScript
declare const Recharts: any;

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  isLive?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon, children, isLive = false, fullWidth = false, className = "" }) => {
  return (
    <div className={`group relative flex flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20 ${fullWidth ? 'col-span-1 md:col-span-2' : ''} ${className}`}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"></div>
      <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
      <div className="relative h-full flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              {icon}
            </div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          {isLive && (
             <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Live
            </span>
          )}
        </div>
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

interface StatPillProps {
  variant: string;
  percentage: number;
  value: string | number;
  label: string;
}

const StatPill = ({ variant, percentage, value, label }: StatPillProps) => (
    <button className={`stat-pill ${variant}`} aria-label={`${value} ${label}`}>
      <div className="ring-wrap" aria-hidden="true">
        <div className="ring" role="presentation" style={{ backgroundImage: `conic-gradient(${variant === 'variant-green' ? '#2ee6a6' : '#ff6ad5'} 0deg, ${variant === 'variant-green' ? '#2ee6a6' : '#ff6ad5'} ${percentage * 3.6}deg, rgba(255, 255, 255, 0.06) ${percentage * 3.6}deg 360deg)`}}>
          <div className="core">{percentage}%</div>
        </div>
      </div>
      <div className="meta">
        <div className="value">{value}</div>
        <div className="label">{label}</div>
      </div>
      <span className="ground-shadow" aria-hidden="true"></span>
    </button>
);


const StatisticsChart = ({ data }: { data: WeeklyReservations[] }) => {
  const [rechartsLoaded, setRechartsLoaded] = useState(typeof Recharts !== 'undefined');
  useEffect(() => {
    if (rechartsLoaded) return;
    const intervalId = setInterval(() => {
      if (typeof Recharts !== 'undefined') {
        setRechartsLoaded(true);
        clearInterval(intervalId);
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, [rechartsLoaded]);

  if (!rechartsLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <SpinnerIcon className="w-8 h-8 text-indigo-400"/>
      </div>
    );
  }

  const { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
  const DataComponent = chartType === 'bar' ? Bar : Line;

  return (
    <div className="flex-grow flex flex-col">
       <div className="flex justify-end gap-2 mb-2">
          <button onClick={() => setChartType('bar')} className={`p-2 rounded ${chartType === 'bar' ? 'bg-cyan-500 text-black' : 'bg-gray-700/50 text-white'}`}><BarChartIcon /></button>
          <button onClick={() => setChartType('line')} className={`p-2 rounded ${chartType === 'line' ? 'bg-cyan-500 text-black' : 'bg-gray-700/50 text-white'}`}><LineChartIcon /></button>
        </div>
      <div className="flex-grow" style={{ width: '100%', minHeight: 250 }}>
        <ResponsiveContainer>
          <ChartComponent data={data} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="day" stroke="#A0AEC0" fontSize={12}/>
            <YAxis stroke="#A0AEC0" fontSize={12}/>
            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
            <DataComponent dataKey="reservations" fill={chartType === 'bar' ? '#2dd4bf' : undefined} stroke={chartType === 'line' ? '#2dd4bf' : undefined} />
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    const unsubParkingLots = onSnapshot(collection(db, 'parkingLots'), (snapshot) => {
        setParkingLots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingLot)));
    });
    const unsubReservations = onSnapshot(collection(db, 'reservations'), (snapshot) => {
        setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation)));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
        setIsLoading(false);
    });

    return () => {
        unsubParkingLots();
        unsubReservations();
        unsubUsers();
    }
  }, []);

  // Handle User Search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const filteredUsers = users.filter(user =>
      user.carPlate.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filteredUsers);
  }, [searchQuery, users]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  const totalSlots = parkingLots.reduce((acc, lot) => acc + lot.slots.length, 0);
  const occupiedSlots = parkingLots.reduce((acc, lot) => acc + lot.slots.filter(s => s.isOccupied).length, 0);
  const occupancyPercentage = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
  
  // Basic stats calculation (can be improved with more complex queries/functions)
  const monthlyRevenue = reservations.reduce((acc, r) => acc + r.amountPaid, 0);
  const weeklyReservationsData: WeeklyReservations[] = [
      { day: 'Sun', reservations: reservations.filter(r => r.startTime.toDate().getDay() === 0).length },
      { day: 'Mon', reservations: reservations.filter(r => r.startTime.toDate().getDay() === 1).length },
      { day: 'Tue', reservations: reservations.filter(r => r.startTime.toDate().getDay() === 2).length },
      { day: 'Wed', reservations: reservations.filter(r => r.startTime.toDate().getDay() === 3).length },
      { day: 'Thu', reservations: reservations.filter(r => r.startTime.toDate().getDay() === 4).length },
      { day: 'Fri', reservations: reservations.filter(r => r.startTime.toDate().getDay() === 5).length },
      { day: 'Sat', reservations: reservations.filter(r => r.startTime.toDate().getDay() === 6).length },
  ];
  
  return (
    <>
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full bg-slate-950 text-white animate-fade-in">
        <div className="flex justify-between items-center animate-slide-in-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
            <button onClick={onLogout} className="bg-red-600/80 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg">Logout</button>
        </div>
        
        {isLoading ? <SpinnerIcon className="w-10 h-10 mx-auto mt-10" /> : (
            <>
                {/* Stat Pills Section */}
                <div className="stat-widget grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 !p-0">
                    <div className="animate-slide-in-2"><StatPill variant="variant-green" percentage={78} value={`$${monthlyRevenue.toLocaleString()}`} label="Total Revenue (USD)" /></div>
                    <div className="animate-slide-in-3"><StatPill variant="variant-pink" percentage={65} value={Math.max(...weeklyReservationsData.map(d => d.reservations)) || 0} label="Peak Day Reservations" /></div>
                    <div className="animate-slide-in-4"><StatPill variant="variant-green" percentage={occupancyPercentage} value={`${occupiedSlots}/${totalSlots}`} label="Current Occupancy" /></div>
                </div>
                
                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DashboardCard title="Weekly Reservations" icon={<TrendingUpIcon />} fullWidth={true} className="animate-slide-in-5">
                        <StatisticsChart data={weeklyReservationsData} />
                    </DashboardCard>
                    
                    <DashboardCard title="Manage Parking" icon={<ConstructIcon className="w-4 h-4 text-white"/>} className="animate-slide-in-6">
                        <p className="text-gray-400 text-sm mb-4">Add, edit, or remove parking lots and slots.</p>
                        <button onClick={() => setIsManageModalOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-2 px-4 rounded-lg">Manage Spaces</button>
                    </DashboardCard>

                    <DashboardCard title="User Management" icon={<PersonIcon className="w-4 h-4 text-white"/>} className="animate-slide-in-7">
                        <p className="text-gray-400 text-sm mb-2">Search for users by their number plate.</p>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search by number plate..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900/50 p-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10 max-h-48 overflow-y-auto animate-fade-in-fast">
                                    {searchResults.map(user => (
                                        <button 
                                            key={user.uid} 
                                            onClick={() => handleSelectUser(user)}
                                            className="w-full text-left p-3 hover:bg-indigo-500/20 flex justify-between items-center"
                                        >
                                            <span>{user.username}</span>
                                            <span className="font-mono text-cyan-400">{user.carPlate}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DashboardCard>

                    <DashboardCard title="Generate Reports" icon={<DocumentTextIcon />} fullWidth={true} className="animate-slide-in-8">
                        <p className="text-gray-400 text-sm mb-4">Download detailed reports for revenue and reservation history.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="flex-1 bg-gray-700/50 hover:bg-gray-700 font-semibold py-2 px-4 rounded-lg">Revenue Report</button>
                            <button className="flex-1 bg-gray-700/50 hover:bg-gray-700 font-semibold py-2 px-4 rounded-lg">Reservations Report</button>
                        </div>
                    </DashboardCard>
                </div>
            </>
        )}
    </div>
    <ManageParkingModal 
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        parkingLots={parkingLots}
        onSave={() => {}}
    />
    <UserDetailModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
    />
    <style>{`
    .stat-widget { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; perspective: 900px; }
    .stat-widget .stat-pill { width: 100%; height: 96px; border-radius: 48px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)); box-shadow: 0 8px 18px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.02); display: flex; align-items: center; gap: 16px; padding: 14px 20px; position: relative; transform-style: preserve-3d; transition: transform 300ms cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 300ms; cursor: pointer; user-select: none; border: none; outline: none; background-clip: padding-box; }
    .stat-widget .stat-pill:before { content: ""; position: absolute; left: 0; right: 0; top: 6px; height: 36px; border-radius: 48px 48px 0 0; background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0)); pointer-events: none; mix-blend-mode: overlay; }
    .stat-widget .ring-wrap { width: 64px; height: 64px; position: relative; flex: 0 0 64px; transform-style: preserve-3d; }
    .stat-widget .ring { width: 100%; height: 100%; border-radius: 50%; display: grid; place-items: center; box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4), inset 0 -6px 18px rgba(0, 0, 0, 0.35); transform-origin: 50% 50%; transition: transform 350ms cubic-bezier(0.2, 0.9, 0.3, 1); will-change: transform; animation: ringRotate 900ms cubic-bezier(0.2, 0.9, 0.3, 1) both; }
    .stat-widget .ring .core { width: 46px; height: 46px; border-radius: 50%; background: rgba(0, 0, 0, 0.55); display: grid; place-items: center; color: #fff; font-weight: 600; font-size: 12px; letter-spacing: -0.02em; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.02); }
    .stat-widget .meta { color: #e9eef9; display: flex; flex-direction: column; justify-content: center; text-align: left; gap: 6px; transform: translateZ(6px); }
    .stat-widget .meta .value { font-size: 20px; font-weight: 700; line-height: 1; }
    .stat-widget .meta .label { font-size: 12px; color: rgba(255, 255, 255, 0.65); font-weight: 500; }
    .stat-widget .stat-pill .ground-shadow { position: absolute; left: 10px; right: 10px; bottom: -12px; height: 14px; border-radius: 50%; filter: blur(18px); opacity: 0.45; pointer-events: none; background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.35)); transform: translateZ(-40px); transition: opacity 220ms; }
    .stat-widget .stat-pill:hover .ground-shadow { opacity: 0.9; }
    .stat-widget .stat-pill:hover { transform: translateY(-10px) rotateX(6deg) rotateY(8deg) scale(1.01); box-shadow: 0 18px 40px rgba(2, 6, 23, 0.6); }
    .stat-widget .stat-pill:active { transform: translateY(-4px) rotateX(2deg) rotateY(3deg) scale(0.995); transition-duration: 120ms; }
    @keyframes floaty { 0% { transform: translateY(0) translateZ(0); } 50% { transform: translateY(-4px) translateZ(4px); } 100% { transform: translateY(0) translateZ(0); } }
    .stat-widget .stat-pill { animation: floaty 4200ms ease-in-out infinite; }
    @keyframes ringRotate { 0% { transform: rotate(-120deg); } 70% { transform: rotate(8deg); } 100% { transform: rotate(0deg); } }
    `}</style>
    </>
  );
};

export default AdminDashboard;
