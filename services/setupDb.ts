
import { collection, writeBatch, GeoPoint, getDocs, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { ParkingLot } from '../types';

const sampleParkingLots: Omit<ParkingLot, 'id'>[] = [
  {
    name: 'Downtown Central Garage',
    address: '123 Main St, Cityville',
    location: new GeoPoint(34.0522, -118.2437),
    hourlyRate: 5,
    slots: Array.from({ length: 50 }, (_, i) => ({
      id: `A${i + 1}`,
      isOccupied: false,
    })),
  },
  {
    name: 'Uptown Plaza Lot',
    address: '456 Oak Ave, Metropolis',
    location: new GeoPoint(34.0622, -118.2537),
    hourlyRate: 3.5,
    slots: Array.from({ length: 30 }, (_, i) => ({
      id: `B${i + 1}`,
      isOccupied: Math.random() > 0.8, // some are occupied
    })),
  },
];

export const setupInitialData = async (): Promise<string> => {
  const lotsCollectionRef = collection(db, 'parkingLots');

  // Check if data already exists to prevent duplicates
  const existingLots = await getDocs(lotsCollectionRef);
  if (!existingLots.empty) {
    return 'Database has already been initialized.';
  }

  const batch = writeBatch(db);

  sampleParkingLots.forEach(lot => {
    const newLotRef = doc(lotsCollectionRef); // Firestore will generate an ID
    batch.set(newLotRef, lot);
  });

  await batch.commit();
  return 'Successfully initialized database with sample parking lots.';
};
