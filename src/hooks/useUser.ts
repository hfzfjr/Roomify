'use client';

import { useSyncExternalStore } from 'react';
import type { User } from '@/types';

let cachedUserString: string | null | undefined;
let cachedUserSnapshot: User | null = null;

function getStoredUserSnapshot(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userData = localStorage.getItem('user');

  if (userData === cachedUserString) {
    return cachedUserSnapshot;
  }

  cachedUserString = userData;

  if (!userData) {
    cachedUserSnapshot = null;
    return null;
  }

  try {
    cachedUserSnapshot = JSON.parse(userData) as User;
  } catch {
    cachedUserSnapshot = null;
  }

  return cachedUserSnapshot;
}

function getServerUserSnapshot(): User | null {
  return null;
}

function subscribeToUserStore(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'user') {
      onStoreChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener('storage', handleStorage);
  };
}

export function useUser(): User | null {
  return useSyncExternalStore(
    subscribeToUserStore,
    getStoredUserSnapshot,
    getServerUserSnapshot
  );
}
