import type { ReactNode } from 'react';

/** 1200×630 Open Graph frame rendered by `next/og` (Satori: flexbox only, inline styles). */
export const OG_SIZE = { width: 1200, height: 630 };

export function OgFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
        background: '#0d0d0d',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      {children}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color: '#c3c2b7' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#256abf',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 22, height: 22, borderRadius: 11, border: '3px solid #ffffff', display: 'flex' }} />
        </div>
        <span style={{ color: '#ffffff', fontWeight: 600 }}>GitScope</span>
        <span>· GitHub profile analytics</span>
      </div>
    </div>
  );
}
