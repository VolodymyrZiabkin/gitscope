import { ImageResponse } from 'next/og';
import { OG_SIZE, OgFrame } from '@/shared/ui/og-frame';

export const alt = 'GitScope — GitHub profile analytics';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <OgFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ fontSize: 80, fontWeight: 700, lineHeight: 1.05 }}>
          Understand any GitHub profile in seconds
        </span>
        <span style={{ fontSize: 34, color: '#c3c2b7' }}>
          Activity heatmap · languages · streaks · top repositories
        </span>
      </div>
    </OgFrame>,
    OG_SIZE,
  );
}
