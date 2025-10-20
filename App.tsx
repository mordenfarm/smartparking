import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, setDoc, runTransaction, query, where, orderBy, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './services/firebase';

import type { ActiveTab, Theme, User, ParkingLot, Reservation, UserWithReservations, Notification } from './types';
import Header from './components/Header';
import Dock from './components/Dock';
import HomeScreen from './components/screens/HomeScreen';
import MapScreen from './components/screens/MapScreen';
import NotificationsScreen from './components/screens/NotificationsScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import LoginModal from './components/LoginModal';
import AdminLoginModal from './components/admin/AdminLoginModal';
import AdminDashboard from './components/admin/AdminDashboard';
import UserDetailsModal from './components/UserDetailsModal';
import { useGeolocation } from './hooks/useGeolocation';
import { SpinnerIcon } from './components/Icons';
import { createDefaultAdmin } from './services/setupAdmin';

const App = () => {
  const [user, setUser] = useState<User | null | 'loading'>('loading');
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  
  const geolocation = useGeolocation();
  const [route, setRoute] = useState<{ from: [number, number], to: [number, number] } | null>(null);

  useEffect(() => {
    document.body.className = `theme-${theme} bg-slate-950 font-sans`;
  }, [theme]);

  // Ensure the default admin user exists on first app load
  useEffect(() => {
    createDefaultAdmin();
  }, []);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Simplified admin check based on email instead of custom claims
        if (firebaseUser.email === 'admin@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const fetchedUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            username: userData.username || firebaseUser.displayName || 'New User',
            carPlate: userData.carPlate || '',
            ecocashNumber: userData.ecocashNumber || '',
          };
          setUser(fetchedUser);
        } else {
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            username: firebaseUser.displayName || 'New User',
            carPlate: '',
            ecocashNumber: '',
          };
          await setDoc(userDocRef, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for real-time parking lot updates
  useEffect(() => {
    const q = collection(db, 'parkingLots');
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ParkingLot[];
      setParkingLots(lots);
    });
    return () => unsubscribe();
  }, []);

  // New useEffect to listen for reservations for the current user
  useEffect(() => {
    if (user && user !== 'loading') {
        const q = query(
            collection(db, 'reservations'),
            where('userId', '==', user.uid),
            orderBy('startTime', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const res = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reservation[];
            setUserReservations(res);
        });

        return () => unsubscribe();
    } else {
        setUserReservations([]); // Clear reservations on logout
    }
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
    setIsAdmin(false);
    setActiveTab('home');
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setIsAdminLoginModalOpen(false);
  };
  
  const handleSaveUserDetails = async (details: { carPlate: string; ecocashNumber: string }) => {
    if (user && user !== 'loading') {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { ...details });
      setUser(prevUser => {
        if (!prevUser || prevUser === 'loading') return null;
        return { ...prevUser, ...details };
      });
    }
    setIsUserDetailsModalOpen(false);
  };

  const handleConfirmReservation = async (lotId: string, slotId: string, hours: number) => {
    if (!user || user === 'loading') {
      alert("You must be logged in to make a reservation.");
      return;
    }

    const lotDocRef = doc(db, 'parkingLots', lotId);
    try {
      let newReservationData: Omit<Reservation, 'id'> | null = null;
      
      await runTransaction(db, async (transaction) => {
        const lotDoc = await transaction.get(lotDocRef);
        if (!lotDoc.exists()) {
          throw new Error("Parking lot does not exist!");
        }

        const lotData = lotDoc.data() as Omit<ParkingLot, 'id'>;
        const slotIndex = lotData.slots.findIndex(s => s.id === slotId);

        if (slotIndex === -1) {
          throw new Error("Parking slot not found!");
        }

        if (lotData.slots[slotIndex].isOccupied) {
          throw new Error("This slot has just been taken! Please select another one.");
        }

        lotData.slots[slotIndex].isOccupied = true;
        
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

        transaction.update(lotDocRef, { slots: lotData.slots });

        const newReservationRef = doc(collection(db, 'reservations'));
        newReservationData = {
          userId: user.uid,
          parkingLotId: lotId,
          parkingLotName: lotData.name,
          slotId: slotId,
          startTime: Timestamp.fromDate(startTime),
          endTime: Timestamp.fromDate(endTime),
          durationHours: hours,
          amountPaid: hours * lotData.hourlyRate,
          status: 'active' as const,
        };
        transaction.set(newReservationRef, newReservationData);
      });

      console.log("Reservation successful!");

      // Send notification after transaction is successful
      if (newReservationData) {
        const newNotification: Omit<Notification, 'id'> = {
            userId: user.uid,
            type: 'RESERVED',
            message: `You have successfully reserved spot ${slotId.toUpperCase()} at ${newReservationData.parkingLotName}.`,
            isRead: false,
            timestamp: Timestamp.now(),
            data: {
                carPlate: user.carPlate,
                amountPaid: newReservationData.amountPaid,
                hoursLeft: newReservationData.durationHours,
            }
        };
        await addDoc(collection(db, 'notifications'), newNotification);
      }

      const userLocation = geolocation.data?.coords;
      const destinationLot = parkingLots.find(l => l.id === lotId);

      if (userLocation && destinationLot) {
        setRoute({
          from: [userLocation.latitude, userLocation.longitude],
          to: [destinationLot.location.latitude, destinationLot.location.longitude]
        });
        setActiveTab('map');
      }

    } catch (error) {
      console.error("Reservation failed:", error);
      alert(`Could not make reservation: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleArrived = () => {
    setRoute(null);
  };
  
  if (user === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <SpinnerIcon className="w-12 h-12 text-indigo-400" />
      </div>
    );
  }

  const fullUserWithReservations: UserWithReservations | null = (user && user !== 'loading') 
    ? { ...user, reservations: userReservations } 
    : null;

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen 
                  user={fullUserWithReservations} 
                  parkingLots={parkingLots} 
                  onFindParking={() => setActiveTab('map')} 
                  onEditDetails={() => setIsUserDetailsModalOpen(true)}
                />;
      case 'map':
        return <MapScreen 
                  parkingLots={parkingLots} 
                  onConfirmReservation={handleConfirmReservation}
                  userLocation={geolocation.data}
                  route={route}
                  onArrived={handleArrived}
                  isLoggedIn={!!user}
                  onLoginSuccess={() => { /* onAuthStateChanged handles this */ }}
                />;
      case 'notifications':
        return <NotificationsScreen user={user} />;
      case 'settings':
        return <SettingsScreen user={user} onThemeChange={setTheme} onLogout={handleLogout} onAdminLogin={() => setIsAdminLoginModalOpen(true)} onUserDetailsUpdate={updatedUser => setUser(updatedUser)} />;
      default:
        return <HomeScreen 
                  user={fullUserWithReservations} 
                  parkingLots={parkingLots} 
                  onFindParking={() => setActiveTab('map')} 
                  onEditDetails={() => setIsUserDetailsModalOpen(true)}
                />;
    }
  };

  if (isAdmin) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white">
      <Header />
      <main className="h-full w-full" key={activeTab}>{renderScreen()}</main>
      {!!user && <Dock activeTab={activeTab} setActiveTab={setActiveTab} />}
      
      {!user && activeTab !== 'map' && <LoginModal 
        isOpen={!user} 
        onClose={() => { /* Can't close if not logged in */ }}
        onSuccess={() => { /* onAuthStateChanged handles this */ }}
      />}
      
      <AdminLoginModal 
        isOpen={isAdminLoginModalOpen} 
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {user && user !== 'loading' && <UserDetailsModal
        isOpen={isUserDetailsModalOpen}
        onClose={() => setIsUserDetailsModalOpen(false)}
        onSave={handleSaveUserDetails}
        user={user}
      />}
    </div>
  );
};

export default App;