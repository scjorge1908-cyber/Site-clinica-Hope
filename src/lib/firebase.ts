import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  getDocsFromServer, 
  getDocFromServer, 
  terminate, 
  clearIndexedDbPersistence,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export async function forceResetFirebase() {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch (e) {
    console.error(e);
  }
  window.location.reload();
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  const errorJson = JSON.stringify(errInfo);
  console.error('Firestore Error Detailed: ', errorJson);
  throw new Error(errorJson);
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro ao fazer login com Google:", error);
    throw error;
  }
}

export async function logout() {
  await signOut(auth);
}

// Collection names
export const COLLECTIONS = {
  SETTINGS: 'settings',
  SPECIALISTS: 'specialists',
  APPROACHES: 'approaches',
  INSURANCE: 'insurance_plans',
  SUBLEASE_ROOMS: 'sublease_rooms',
  SUBLEASE_BOOKINGS: 'sublease_bookings'
};

// Document IDs
export const DOCS = {
  HOME_SETTINGS: 'home'
};

export async function getHomeSettings() {
  const path = `${COLLECTIONS.SETTINGS}/${DOCS.HOME_SETTINGS}`;
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, DOCS.HOME_SETTINGS);
    const docSnap = await getDocFromServer(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveHomeSettings(settings: any) {
  const path = `${COLLECTIONS.SETTINGS}/${DOCS.HOME_SETTINGS}`;
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, DOCS.HOME_SETTINGS);
    await setDoc(docRef, settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getSpecialists() {
  const path = COLLECTIONS.SPECIALISTS;
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.SPECIALISTS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveSpecialists(specialists: any[]) {
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.SPECIALISTS));
    const existingIds = querySnapshot.docs.map(doc => doc.id);
    const newIds = specialists.map(s => s.id);
    
    const batch = writeBatch(db);
    
    // Delete removed docs
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    for (const id of toDelete) {
      batch.delete(doc(db, COLLECTIONS.SPECIALISTS, id));
    }

    // Update/Create current docs
    for (const s of specialists) {
      if (!s.id) continue;
      batch.set(doc(db, COLLECTIONS.SPECIALISTS, s.id), s);
    }
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.SPECIALISTS);
  }
}

export async function saveApproaches(approaches: any[]) {
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.APPROACHES));
    const existingIds = querySnapshot.docs.map(doc => doc.id);
    const newIds = approaches.map(a => a.id);
    
    const batch = writeBatch(db);
    
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    for (const id of toDelete) {
      batch.delete(doc(db, COLLECTIONS.APPROACHES, id));
    }

    for (const a of approaches) {
      if (!a.id) continue;
      batch.set(doc(db, COLLECTIONS.APPROACHES, a.id), a);
    }
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.APPROACHES);
  }
}

export async function saveInsurancePlans(plans: any[]) {
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.INSURANCE));
    const existingIds = querySnapshot.docs.map(doc => doc.id);
    const newIds = plans.map(p => p.id);
    
    const batch = writeBatch(db);
    
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    for (const id of toDelete) {
      batch.delete(doc(db, COLLECTIONS.INSURANCE, id));
    }

    for (const p of plans) {
      if (!p.id) continue;
      batch.set(doc(db, COLLECTIONS.INSURANCE, p.id), p);
    }
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.INSURANCE);
  }
}

export async function getApproaches() {
  const path = COLLECTIONS.APPROACHES;
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.APPROACHES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getInsurancePlans() {
  const path = COLLECTIONS.INSURANCE;
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.INSURANCE));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getSubleaseRooms() {
  const path = COLLECTIONS.SUBLEASE_ROOMS;
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.SUBLEASE_ROOMS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveSubleaseRooms(rooms: any[]) {
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.SUBLEASE_ROOMS));
    const existingIds = querySnapshot.docs.map(doc => doc.id);
    const newIds = rooms.map(r => r.id);
    
    const batch = writeBatch(db);
    
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    for (const id of toDelete) {
      batch.delete(doc(db, COLLECTIONS.SUBLEASE_ROOMS, id));
    }

    for (const r of rooms) {
      if (!r.id) continue;
      batch.set(doc(db, COLLECTIONS.SUBLEASE_ROOMS, r.id), r);
    }
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.SUBLEASE_ROOMS);
  }
}

export async function getSubleaseBookings() {
  const path = COLLECTIONS.SUBLEASE_BOOKINGS;
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.SUBLEASE_BOOKINGS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveSubleaseBooking(booking: any) {
  const path = `${COLLECTIONS.SUBLEASE_BOOKINGS}/${booking.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.SUBLEASE_BOOKINGS, booking.id), booking);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateSubleaseBookingStatus(bookingId: string, status: string) {
  const path = `${COLLECTIONS.SUBLEASE_BOOKINGS}/${bookingId}`;
  try {
    const docRef = doc(db, COLLECTIONS.SUBLEASE_BOOKINGS, bookingId);
    await setDoc(docRef, { status }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

