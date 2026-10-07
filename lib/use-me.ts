'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Me {
  id: string;
  email: string;
  role: 'hr_manager' | 'hr_assistant' | 'employee';
  full_name: string;
  employee_number: string | null;
}

/** Client session hook. Redirects to /login when no valid session exists. */
export function useMe(options?: { allow?: Me['role'][] }): { me: Me | null; loading: boolean } {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = (await res.json()) as Me;
        if (options?.allow && !options.allow.includes(data.role)) {
          router.replace(data.role === 'employee' ? '/dashboard' : '/hr');
          return;
        }
        if (!cancelled) setMe(data);
      } catch {
        router.replace('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { me, loading };
}
