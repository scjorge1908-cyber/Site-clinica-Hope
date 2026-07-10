import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPageView from './components/LandingPageView';
import BookingPageView from './components/BookingPageView';
import AdminDashboardView from './components/AdminDashboardView';
import ProfessionalPortalView from './components/ProfessionalPortalView';
import RegisterPageView from './components/RegisterPageView';
import Footer from './components/Footer';
import { Room, Booking, AdminSettings, ProfessionalProfile } from './types';
import { INITIAL_ROOMS, INITIAL_ADMIN_SETTINGS } from './data';
import { db } from '../lib/firebase';
import { Screen } from '../types';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

interface SublocacaoSystemWrapperProps {
  onNavigate: (screen: any) => void;
}

export default function SublocacaoSystemWrapper({ onNavigate }: SublocacaoSystemWrapperProps) {
  const [currentView, setView] = useState<string>('home'); // 'home' | 'booking' | 'professional-dashboard' | 'register' | 'register-login' | 'register-signup' | 'admin'
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<ProfessionalProfile | null>(null);
  
  // Real-time Firestore sync states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<ProfessionalProfile[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(INITIAL_ADMIN_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load Active User from localStorage if saved
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('sublease_active_user');
      if (savedUser) {
        setActiveUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn('Failed to load sublease active user:', e);
    }
  }, []);

  // Update activeUser in localStorage
  const handleSetActiveUser = (user: ProfessionalProfile | null) => {
    setActiveUser(user);
    try {
      if (user) {
        localStorage.setItem('sublease_active_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('sublease_active_user');
      }
    } catch (e) {
      console.warn('Failed to save sublease active user:', e);
    }
  };

  // 1. Real-time synchronizer with Firestore
  useEffect(() => {
    setIsLoading(true);

    // Sync admin settings
    const unsubSettings = onSnapshot(doc(db, 'sublease_settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setAdminSettings(snapshot.data() as AdminSettings);
      } else {
        // Seed initial settings if none exist
        setDoc(doc(db, 'sublease_settings', 'config'), INITIAL_ADMIN_SETTINGS)
          .then(() => console.log('Admin settings seeded successfully.'))
          .catch(err => console.error('Error seeding settings:', err));
        setAdminSettings(INITIAL_ADMIN_SETTINGS);
      }
    }, (error) => {
      console.warn("Erro no listener de sublease_settings (Sublocação):", error);
      setAdminSettings(INITIAL_ADMIN_SETTINGS);
    });

    // Sync rooms
    const unsubRooms = onSnapshot(collection(db, 'sublease_rooms'), (snapshot) => {
      if (!snapshot.empty) {
        const loadedRooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Room[];
        setRooms(loadedRooms);
      } else {
        // Seed initial rooms
        const promises = INITIAL_ROOMS.map(room => setDoc(doc(db, 'sublease_rooms', room.id), room));
        Promise.all(promises)
          .then(() => console.log('Rooms seeded successfully.'))
          .catch(err => console.error('Error seeding rooms:', err));
        setRooms(INITIAL_ROOMS);
      }
    }, (error) => {
      console.warn("Erro no listener de sublease_rooms (Sublocação):", error);
      setRooms(INITIAL_ROOMS);
    });

    // Sync bookings
    const unsubBookings = onSnapshot(collection(db, 'sublease_bookings'), (snapshot) => {
      const loadedBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Booking[];
      setBookings(loadedBookings);
    }, (error) => {
      console.warn("Erro no listener de sublease_bookings (Sublocação):", error);
      setBookings([]);
    });

    // Sync users
    const unsubUsers = onSnapshot(collection(db, 'sublease_users'), (snapshot) => {
      const loadedUsers = snapshot.docs.map(d => d.data()) as ProfessionalProfile[];
      setRegisteredUsers(loadedUsers);
    }, (error) => {
      console.warn("Erro no listener de sublease_users (Sublocação):", error);
      setRegisteredUsers([]);
    });

    setIsLoading(false);

    return () => {
      unsubSettings();
      unsubRooms();
      unsubBookings();
      unsubUsers();
    };
  }, []);

  // API operations
  const handleUpdateSettings = async (newSettings: AdminSettings) => {
    try {
      await setDoc(doc(db, 'sublease_settings', 'config'), newSettings);
      setAdminSettings(newSettings);
    } catch (err) {
      console.error('Error updating admin settings:', err);
    }
  };

  const handleUpdateRooms = async (updatedRooms: Room[]) => {
    try {
      // Find deleted rooms by comparing current rooms with the new list
      const updatedIds = new Set(updatedRooms.map(r => r.id));
      const deletedRooms = rooms.filter(r => !updatedIds.has(r.id));
      
      for (const r of deletedRooms) {
        await deleteDoc(doc(db, 'sublease_rooms', r.id));
      }

      // Save/update the remaining rooms
      for (const r of updatedRooms) {
        await setDoc(doc(db, 'sublease_rooms', r.id), r);
      }
    } catch (err) {
      console.error('Error updating rooms:', err);
    }
  };

  const handleUpdateUsers = async (updatedUsers: ProfessionalProfile[]) => {
    try {
      // Find deleted users by comparing current registeredUsers with the new list
      const updatedEmails = new Set(updatedUsers.map(u => u.email));
      const deletedUsers = registeredUsers.filter(u => !updatedEmails.has(u.email));
      
      for (const u of deletedUsers) {
        await deleteDoc(doc(db, 'sublease_users', u.email));
      }

      // Save/update the remaining users
      for (const u of updatedUsers) {
        await setDoc(doc(db, 'sublease_users', u.email), u);
      }
    } catch (err) {
      console.error('Error updating users:', err);
    }
  };

  const handleRegister = async (profile: ProfessionalProfile) => {
    try {
      await setDoc(doc(db, 'sublease_users', profile.email), {
        ...profile,
        approvalStatus: profile.approvalStatus || 'Aprovado' // Default to approved in this direct portal registration
      });
      handleSetActiveUser(profile);
      setView('professional-dashboard');
    } catch (err) {
      console.error('Error registering professional:', err);
    }
  };

  const handleLogin = (profile: ProfessionalProfile) => {
    handleSetActiveUser(profile);
    setView('professional-dashboard');
  };

  const handleLogout = () => {
    handleSetActiveUser(null);
    setView('home');
  };

  const handleAddBooking = async (booking: Booking) => {
    try {
      await setDoc(doc(db, 'sublease_bookings', booking.id), booking);
    } catch (err) {
      console.error('Error adding booking:', err);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      // Just update the booking status to 'Cancelado'
      await updateDoc(doc(db, 'sublease_bookings', bookingId), { status: 'Cancelado' });
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  // Find currently selected room for the booking panel
  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-brand-variant font-medium">Carregando sublocaHope...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Sublocação Header */}
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        activeUser={activeUser} 
        onBackToClinic={() => onNavigate(Screen.Home)}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4">
        {currentView === 'home' && (
          <LandingPageView 
            rooms={rooms} 
            adminSettings={adminSettings} 
            setView={setView} 
            onSelectRoom={(id) => setSelectedRoomId(id)} 
          />
        )}

        {currentView === 'booking' && selectedRoom && (
          <BookingPageView 
            selectedRoom={selectedRoom} 
            pricePerHour={selectedRoom.pricePerHour} 
            onAddBooking={handleAddBooking} 
            setView={setView} 
            professionalName={activeUser?.name} 
            professionalId={activeUser?.registerNumber} 
            adminSettings={adminSettings} 
          />
        )}

        {currentView === 'professional-dashboard' && activeUser && (
          <ProfessionalPortalView 
            activeUser={activeUser} 
            bookings={bookings} 
            rooms={rooms} 
            onCancelBooking={handleCancelBooking} 
            onAddBooking={handleAddBooking} 
            setView={setView} 
            onLogout={handleLogout} 
            onUpdateProfile={(profile) => handleSetActiveUser(profile)} 
          />
        )}

        {(currentView === 'register' || currentView === 'register-login' || currentView === 'register-signup') && (
          <RegisterPageView 
            onRegister={handleRegister} 
            setView={setView} 
            registeredUsers={registeredUsers} 
            onLogin={handleLogin} 
            initialTab={currentView.includes('login') ? 'login' : 'register'} 
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboardView 
            adminSettings={adminSettings} 
            bookings={bookings} 
            rooms={rooms} 
            onUpdateSettings={handleUpdateSettings} 
            onCancelBooking={handleCancelBooking} 
            onUpdateRooms={handleUpdateRooms} 
            registeredUsers={registeredUsers} 
            onUpdateUsers={handleUpdateUsers} 
            setView={setView} 
          />
        )}
      </main>
    </div>
  );
}
