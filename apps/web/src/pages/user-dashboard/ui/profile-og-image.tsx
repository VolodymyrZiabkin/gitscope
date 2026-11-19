import 'server-only';
import { ImageResponse } from 'next/og';
import { formatCompact } from '@/shared/lib';
import { OG_SIZE, OgFrame } from '@/shared/ui/og-frame';
import { getUserReport } from '../api/load';

/** Link previews must not hang on a cold API — fall back to the generic card instead. */
const OG_TIMEOUT_MS = 8_000;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 56, fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 26, color: '#c3c2b7' }}>{label}</span>
    </div>
  );
}

export async function renderProfileOgImage(username: string): Promise<ImageResponse> {
  const result = await getUserReport(username, { timeoutMs: OG_TIMEOUT_MS });

  if (!result.ok) {
    return new ImageResponse(
      <OgFrame>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 72, fontWeight: 700 }}>@{username}</span>
          <span style={{ fontSize: 34, color: '#c3c2b7' }}>Activity, languages, streaks and top repositories</span>
        </div>
      </OgFrame>,
      OG_SIZE,
    );
  }

  const { profile, stats, languages, insights } = result.data;
  const visibleLanguages = languages.filter((language) => language.share >= 0.01);

  return new ImageResponse(
    <OgFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> only */}
          <img
            src={profile.avatarUrl}
            width={160}
            height={160}
            alt=""
            style={{ borderRadius: 80, border: '4px solid #2c2c2a' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 64, fontWeight: 700 }}>{profile.name ?? profile.login}</span>
            <span style={{ fontSize: 32, color: '#c3c2b7' }}>@{profile.login}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 72 }}>
          <Stat value={formatCompact(stats.totalStars)} label="stars" />
          <Stat value={formatCompact(profile.followers)} label="followers" />
          <Stat value={formatCompact(stats.repositories)} label="repositories" />
          {insights.topLanguage ? <Stat value={insights.topLanguage} label="top language" /> : null}
        </div>
        {visibleLanguages.length > 0 ? (
          <div style={{ display: 'flex', width: '100%', height: 16, gap: 4 }}>
            {visibleLanguages.map((language) => (
              <div
                key={language.name}
                style={{
                  display: 'flex',
                  width: `${language.share * 100}%`,
                  height: '100%',
                  borderRadius: 8,
                  background: language.color ?? '#898781',
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </OgFrame>,
    OG_SIZE,
  );
}
