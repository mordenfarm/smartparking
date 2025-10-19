import React, { useState, useEffect } from 'react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { ParkingLot } from '../../types';
import { GeoPoint } from 'firebase/firestore';

const LotForm = ({ lot, onSave, onCancel }: { lot: Partial<ParkingLot> | null, onSave: (lotData: ParkingLot) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState({
    id: lot?.id || '',
    name: lot?.name || '',
    address: lot?.address || '',
    lat: lot?.location instanceof GeoPoint ? lot.location.latitude : 0,
    lng: lot?.location instanceof GeoPoint ? lot.location.longitude : 0,
    hourlyRate: lot?.hourlyRate || 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: formData.id,
      name: formData.name,
      address: formData.address,
      location: new GeoPoint(formData.lat, formData.lng),
      hourlyRate: formData.hourlyRate,
      slots: lot?.slots || [],
    });
  };

  const inputStyle = "w-full bg-slate-900/50 text-white p-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="p-6 animate-fade-in-fast">
        <h2 className="text-xl font-bold text-center mb-4 text-indigo-400">{lot?.id ? 'Edit Parking Lot' : 'Add New Parking Lot'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block mb-2 text-sm font-medium text-slate-400">Lot Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyle} required />
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-slate-400">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputStyle} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block mb-2 text-sm font-medium text-slate-400">Latitude</label>
                    <input type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} className={inputStyle} required />
                </div>
                 <div>
                    <label className="block mb-2 text-sm font-medium text-slate-400">Longitude</label>
                    <input type="number" step="any" name="lng" value={formData.lng} onChange={handleChange} className={inputStyle} required />
                </div>
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-slate-400">Hourly Rate ($)</label>
                <input type="number" step="0.01" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className={inputStyle} required />
            </div>
            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                    Cancel
                </button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-105">
                    Save Changes
                </button>
            </div>
        </form>
    </div>
  );
};


interface ManageParkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  parkingLots: ParkingLot[];
  onSave: (updatedLots: ParkingLot[]) => void;
}

const ManageParkingModal = ({ isOpen, onClose, parkingLots, onSave }: ManageParkingModalProps) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingLot, setEditingLot] = useState<ParkingLot | null>(null);

  useEffect(() => {
    if (isOpen) {
        setView('list');
        setEditingLot(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEdit = (lot: ParkingLot) => {
    setEditingLot(lot);
    setView('form');
  };

  const handleAdd = () => {
    setEditingLot(null);
    setView('form');
  };
  
  const handleSaveLot = async (lotData: ParkingLot) => {
    try {
        if (editingLot) {
            const lotDocRef = doc(db, 'parkingLots', lotData.id);
            await setDoc(lotDocRef, lotData, { merge: true });
        } else {
            // Firestore will auto-generate an ID
            await addDoc(collection(db, 'parkingLots'), lotData);
        }
        setView('list');
        setEditingLot(null);
    } catch (error) {
        console.error("Failed to save parking lot: ", error);
        alert("Could not save changes.");
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="group relative flex w-full max-w-lg flex-col rounded-xl bg-slate-950 shadow-2xl transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
        <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
        <div className="relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20">
              <ion-icon name="close-circle" class="w-8 h-8"></ion-icon>
            </button>

            {view === 'list' && (
                <div className="p-6">
                    <h2 className="text-xl font-bold text-center mb-4 text-indigo-400">Manage Parking Lots</h2>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {parkingLots.map(lot => (
                            <div key={lot.id} className="bg-slate-900/50 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-white">{lot.name}</p>
                                    <p className="text-sm text-slate-400">{lot.address}</p>
                                </div>
                                <button onClick={() => handleEdit(lot)} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                                    Edit
                                </button>
                            </div>
                        ))}
                    </div>
                     <button onClick={handleAdd} className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-transform hover:scale-105">
                        Add New Lot
                    </button>
                </div>
            )}
            
            {view === 'form' && (
                <LotForm lot={editingLot} onSave={handleSaveLot} onCancel={() => setView('list')} />
            )}
            
        </div>
      </div>
    </div>
  );
};

export default ManageParkingModal;
