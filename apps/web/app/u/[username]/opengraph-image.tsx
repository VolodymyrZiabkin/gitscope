import { renderProfileOgImage } from '@/pages/user-dashboard';
import { OG_SIZE } from '@/shared/ui/og-frame';

export const alt = 'GitScope analytics card for a GitHub profile';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return renderProfileOgImage(username);
}
