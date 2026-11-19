'use client';

import { useEffect } from 'react';

/**
 * The free-tier API instance sleeps when idle and needs up to a minute to start. Ping it as soon as the home page
 * opens, so it is awake by the time the visitor has typed a username.
 */
export function WakeApi() {
  useEffect(() => {
    void fetch('/api/health', { cache: 'no-store' }).catch(() => undefined);
  }, []);
  return null;
}
