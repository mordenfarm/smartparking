import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './services/firebase';

import type { ActiveTab, Theme, User, ParkingLot, Reservation } from './types';
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

const App = () => {
  const [user, setUser] = useState<User | null | 'loading'>('loading');
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
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Check for admin custom claims
        const tokenResult = await firebaseUser.getIdTokenResult();
        if (tokenResult.claims.admin) {
          setIsAdmin(true);
        }

        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
           // In a real app, reservations would be a subcollection or separate query
          const fullUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            username: userData.username || firebaseUser.displayName || 'New User',
            carPlate: userData.carPlate || '',
            ecocashNumber: userData.ecocashNumber || '',
            reservations: [], // This would be fetched separately
          };
          setUser(fullUser);
        } else {
          // Create a new user document if it doesn't exist
          const newUser: Omit<User, 'reservations'> = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            username: firebaseUser.displayName || 'New User',
            carPlate: '',
            ecocashNumber: '',
          };
          await setDoc(userDocRef, newUser);
          setUser({ ...newUser, reservations: [] });
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
      await setDoc(userDocRef, { ...details }, { merge: true });
      setUser(prevUser => {
        if (!prevUser || prevUser === 'loading') return null;
        return { ...prevUser, ...details };
      });
    }
    setIsUserDetailsModalOpen(false);
  };

  const handleConfirmReservation = async (lotId: string, slotId: string, hours: number) => {
      try {
        const makeReservation = httpsCallable(functions, 'handleReservationPayment');
        await makeReservation({ lotId, slotId, hours });
        
        // UI can optimistically update or wait for Firestore listener to catch changes.
        // For now, let's trigger routing.
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
        alert("Could not make reservation. Please try again.");
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

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen 
                  user={user} 
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
        return <SettingsScreen user={user} onThemeChange={setTheme} onLogout={handleLogout} onAdminLogin={() => setIsAdminLoginModalOpen(true)} onUserDetailsUpdate={setUser} />;
      default:
        return <HomeScreen 
                  user={user} 
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

      {user && <UserDetailsModal
        isOpen={isUserDetailsModalOpen}
        onClose={() => setIsUserDetailsModalOpen(false)}
        onSave={handleSaveUserDetails}
        user={user}
      />}
    </div>
  );
};

export default App;
