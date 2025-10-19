import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Notification, User } from '../../types';
import { CheckmarkCircleIcon, TrashIcon, WalletIcon, CarIcon, ClockIcon, SpinnerIcon } from '../Icons';

interface NotificationCardProps {
  notification: Notification;
  onDelete: (id: string) => void;
  onMarkAsLeft: (id: string) => void;
  className?: string;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onDelete, onMarkAsLeft, className = "" }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'RESERVED': return <CheckmarkCircleIcon className="w-8 h-8 text-emerald-400" />;
      case 'TIME_EXPIRED': return <ClockIcon className="w-8 h-8 text-yellow-400" />;
      default: return <CheckmarkCircleIcon className="w-8 h-8 text-blue-400" />;
    }
  };

  return (
    <div className={`group relative flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20 ${notification.isRead ? 'opacity-60' : ''} ${className}`}>
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30 ${notification.isRead ? '!opacity-5' : ''}`}></div>
        <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
        <div className="relative flex gap-4">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="flex-grow">
                <p className="text-white">{notification.message}</p>
                {notification.type === 'RESERVED' && notification.data && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-2">
                        <span className="flex items-center gap-1"><CarIcon className="w-4 h-4"/>{notification.data.carPlate}</span>
                        <span className="flex items-center gap-1"><WalletIcon className="w-4 h-4"/>${notification.data.amountPaid?.toFixed(2)}</span>
                        <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4"/>{notification.data.hoursLeft}h left</span>
                    </div>
                )}
                <p className="text-xs text-slate-500 mt-2">{notification.timestamp.toDate().toLocaleString()}</p>
                
                {notification.type === 'TIME_EXPIRED' && (
                    <button onClick={() => onMarkAsLeft(notification.id)} className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                    Mark as Left Parking
                    </button>
                )}
            </div>
            <button onClick={() => onDelete(notification.id)} className="text-slate-500 hover:text-pink-500 transition-colors self-start">
                <TrashIcon />
            </button>
        </div>
    </div>
  );
};

const NotificationsScreen = ({ user }: { user: User | null }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    };
    
    const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
        setNotifications(notifs);
        setIsLoading(false);
    });

    return () => unsubscribe();

  }, [user]);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  const handleMarkAsLeft = (id: string) => {
    console.log(`Marked as left for notification ${id}`);
    handleDelete(id);
  };

  return (
    <div className="p-4 pt-24 pb-28 space-y-4 overflow-y-auto h-full animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-4 animate-slide-in-1">Notifications</h1>
      {isLoading ? (
        <div className="text-center py-10">
            <SpinnerIcon className="w-8 h-8 mx-auto text-indigo-400"/>
        </div>
      ) : notifications.length > 0 ? (
        notifications.map((n, index) => (
          <NotificationCard key={n.id} notification={n} onDelete={handleDelete} onMarkAsLeft={handleMarkAsLeft} className={`animate-slide-in-${index + 2}`} />
        ))
      ) : (
        <div className="text-center py-10">
          <p className="text-slate-400">You have no new notifications.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;
