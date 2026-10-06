"use client";

import { useEffect, useState } from 'react';
import { DB, loadDB, saveDB, seedDB } from '@/lib/db';

// Hydration-safe shared store hook.
// First render uses deterministic seed data (matches SSR HTML).
// Stored state loads after mount, then stays synced on focus/storage.
export function useDB(): [DB, (fn: (prev: DB) => DB) => void] {
  const [db, setDb] = useState<DB>(() => seedDB());

  useEffect(() => {
    const refresh = () => {
      const fresh = loadDB();
      setDb((prev) => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const updateDB = (fn: (prev: DB) => DB) => {
    setDb((prev) => {
      const next = fn(prev);
      saveDB(next);
      return next;
    });
  };

  return [db, updateDB];
}
