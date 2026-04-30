import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, getDocsFromServer, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

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
  INSURANCE: 'insurance_plans'
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
    // 1. Get current IDs from SERVER to detect deletions correctly
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.SPECIALISTS));
    const existingIds = querySnapshot.docs.map(doc => doc.id);
    const newIds = specialists.map(s => s.id);
    
    // 2. Delete removed docs
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    for (const id of toDelete) {
      const delRef = doc(db, COLLECTIONS.SPECIALISTS, id);
      await deleteDoc(delRef);
    }

    // 3. Update/Create current docs
    for (const s of specialists) {
      if (!s.id) continue;
      const docRef = doc(db, COLLECTIONS.SPECIALISTS, s.id);
      await setDoc(docRef, s);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.SPECIALISTS);
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

export async function saveApproaches(approaches: any[]) {
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.APPROACHES));
    const existingIds = querySnapshot.docs.map(doc => doc.id);
    const newIds = approaches.map(a => a.id);
    
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    for (const id of toDelete) {
      await deleteDoc(doc(db, COLLECTIONS.APPROACHES, id));
    }

    for (const a of approaches) {
      if (!a.id) continue;
      const docRef = doc(db, COLLECTIONS.APPROACHES, a.id);
      await setDoc(docRef, a);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.APPROACHES);
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

export async function saveInsurancePlans(plans: any[]) {
  try {
    const querySnapshot = await getDocsFromServer(collection(db, COLLECTIONS.INSURANCE));
    const existingIds = querySnapshot.docs.map(doc => doc.id);
    const newIds = plans.map(p => p.id);
    
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    for (const id of toDelete) {
      await deleteDoc(doc(db, COLLECTIONS.INSURANCE, id));
    }

    for (const p of plans) {
      if (!p.id) continue;
      const docRef = doc(db, COLLECTIONS.INSURANCE, p.id);
      await setDoc(docRef, p);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.INSURANCE);
  }
}

