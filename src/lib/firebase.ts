import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, query, collection, limit } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: getLocalUserId(),
    },
    operationType,
    path,
  };
  console.warn('Firestore Notice: ', JSON.stringify(errInfo));
}

// Singleton Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const USER_ID_KEY = 'offshoot_casino_user_id_v1';
const USERNAME_KEY = 'offshoot_casino_username_v1';
const AVATAR_KEY = 'offshoot_casino_avatar_v1';

export function getLocalUserId(): string {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = 'player_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return 'player_guest';
  }
}

export function getLocalUsername(): string {
  try {
    return localStorage.getItem(USERNAME_KEY) || 'HighRoller_' + Math.floor(100 + Math.random() * 900);
  } catch {
    return 'HighRoller_888';
  }
}

export function setLocalUsername(name: string): void {
  try {
    localStorage.setItem(USERNAME_KEY, name);
  } catch {
    // Ignore
  }
}

export function getLocalAvatar(): string {
  try {
    return localStorage.getItem(AVATAR_KEY) || '👑';
  } catch {
    return '👑';
  }
}

export function setLocalAvatar(avatar: string): void {
  try {
    localStorage.setItem(AVATAR_KEY, avatar);
  } catch {
    // Ignore
  }
}

export interface RealLeaderboardEntry {
  userId: string;
  username: string;
  avatar: string;
  balance: number;
  biggestWin: number;
  totalWins: number;
  netProfit: number;
  updatedAt: string;
}

// Sync player profile to Firestore
export async function syncPlayerToLeaderboard(entry: {
  username: string;
  avatar: string;
  balance: number;
  biggestWin: number;
  totalWins: number;
  netProfit: number;
}): Promise<void> {
  const userId = getLocalUserId();
  const path = `leaderboard/${userId}`;
  try {
    const payload: RealLeaderboardEntry = {
      userId,
      username: entry.username.slice(0, 30),
      avatar: entry.avatar.slice(0, 10),
      balance: Math.round(entry.balance),
      biggestWin: Math.round(entry.biggestWin),
      totalWins: Math.round(entry.totalWins),
      netProfit: Math.round(entry.netProfit),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'leaderboard', userId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Listen to global real players in real time
export function subscribeToRealLeaderboard(
  callback: (players: RealLeaderboardEntry[]) => void
): () => void {
  const path = 'leaderboard';
  try {
    const q = query(collection(db, 'leaderboard'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: RealLeaderboardEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as RealLeaderboardEntry;
          if (data && data.userId && data.username) {
            list.push(data);
          }
        });
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}
