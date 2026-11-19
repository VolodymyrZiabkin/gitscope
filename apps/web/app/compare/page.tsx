import type { Metadata } from 'next';
import { ComparePage } from '@/pages/compare';

export const metadata: Metadata = {
  title: 'Compare developers',
  description: 'Compare two GitHub profiles side by side: stars, followers, activity, streaks and languages.',
};

export default function Page({ searchParams }: PageProps<'/compare'>) {
  return <ComparePage searchParams={searchParams} />;
}
