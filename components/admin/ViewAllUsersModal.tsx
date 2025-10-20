import React from 'react';
import type { User } from '../../types';
import { PersonIcon, CarIcon } from '../Icons';

interface ViewAllUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSelectUser: (user: User) => void;
}

// FIX: Define a props interface for UserCard. This fixes an issue where TypeScript
// would complain about the 'key' prop being passed to the component during a map operation,
// as the inline object type definition didn't account for React's special props.
interface UserCardProps {
  user: User;
  onSelect: () => void;
}

// FIX: Use React.FC to correctly type the functional component, resolving the issue with the 'key' prop.
const UserCard: React.FC<UserCardProps> = ({ user, onSelect }) => (
    <div className="bg-slate-900/50 p-4 rounded-lg flex justify-between items-center transition-colors hover:bg-slate-800/60">
        <div>
            <p className="font-semibold text-white flex items-center gap-2">
                <PersonIcon className="w-5 h-5 text-indigo-300" />
                {user.username}
            </p>
            <p className="text-sm text-slate-400">{user.email}</p>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                <CarIcon className="w-5 h-5 text-cyan-400" />
                <span className="font-mono">{user.carPlate || 'No Plate'}</span>
            </p>
        </div>
        <button
            onClick={onSelect}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
            View Details
        </button>
    </div>
);


const ViewAllUsersModal = ({ isOpen, onClose, users, onSelectUser }: ViewAllUsersModalProps) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="group relative flex w-full max-w-2xl flex-col rounded-xl bg-slate-950 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
                <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
                <div className="relative p-6 text-white">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20">
                        <ion-icon name="close-circle" class="w-8 h-8"></ion-icon>
                    </button>

                    <h2 className="text-2xl font-bold text-center mb-6 text-indigo-400">All Users ({users.length})</h2>
                    
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                        {users.length > 0 ? (
                            users.sort((a, b) => a.username.localeCompare(b.username)).map(user => (
                                <UserCard
                                    key={user.uid}
                                    user={user}
                                    onSelect={() => onSelectUser(user)}
                                />
                            ))
                        ) : (
                            <p className="text-slate-400 text-center py-10">No users found in the database.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewAllUsersModal;