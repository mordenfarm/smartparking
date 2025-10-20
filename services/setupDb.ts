
import { collection, getDocs, writeBatch, doc, GeoPoint } from 'firebase/firestore';
import { db } from './firebase';
import type { ParkingLot, ParkingSlot } from '../types';

const sampleParkingLotsData = [
  {
    name: 'Avondale Shopping Centre',
    address: 'Lanark Road, Harare',
    location: new GeoPoint(-17.7968, 31.0335),
    hourlyRate: 1.5,
  },
  {
    name: 'Eastgate Shopping Mall',
    address: 'Robert Mugabe Rd, Harare',
    location: new GeoPoint(-17.8317, 31.0539),
    hourlyRate: 2.0,
  },
  {
    name: "Sam Levy's Village",
    address: 'Borrowdale Road, Harare',
    location: new GeoPoint(-17.7788, 31.0858),
    hourlyRate: 2.5,
  },
];

const TOTAL_SLOTS_PER_LOT = 20;

export const setupInitialData = async (): Promise<string> => {
  const parkingLotsRef = collection(db, 'parkingLots');
  const snapshot = await getDocs(parkingLotsRef);

  if (!snapshot.empty) {
    const message = 'Database already contains parking lot data. Setup skipped.';
    console.log(message);
    return message;
  }

  const batch = writeBatch(db);

  try {
    console.log('Setting up initial database data...');
    for (const lotData of sampleParkingLotsData) {
      const lotDocRef = doc(collection(db, 'parkingLots'));
      
      const slots: ParkingSlot[] = [];
      for (let i = 1; i <= TOTAL_SLOTS_PER_LOT; i++) {
        const slotId = `P${i}`;
        // Slightly randomize slot coords for spiderfy effect on the map
        const offsetLat = (Math.random() - 0.5) * 0.0001;
        const offsetLng = (Math.random() - 0.5) * 0.0001;
        slots.push({
          id: slotId,
          isOccupied: false,
          coords: {
            lat: lotData.location.latitude + offsetLat,
            lng: lotData.location.longitude + offsetLng,
          }
        });
      }

      const newLot: Omit<ParkingLot, 'id'> = {
        name: lotData.name,
        address: lotData.address,
        location: lotData.location,
        hourlyRate: lotData.hourlyRate,
        slots: slots,
      };
      
      batch.set(lotDocRef, newLot);
    }

    await batch.commit();
    const successMessage = 'Successfully initialized database with sample parking lots and slots!';
    console.log(successMessage);
    return successMessage;
  } catch (error) {
    const errorMessage = `Error setting up database: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};
