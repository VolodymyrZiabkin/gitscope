import type { Profile } from '@gitscope/shared';
import {
  ArrowLeftRightIcon,
  BuildingIcon,
  CalendarIcon,
  ExternalLinkIcon,
  LinkIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CopyLinkButton } from './copy-link-button';
import { formatCompact, formatMonthYear } from '@/shared/lib';
import { Button } from '@/shared/ui/button';

function MetaItem({ icon: Icon, children }: { icon: typeof MapPinIcon; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-center gap-1.5">
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </li>
  );
}

const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

export function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <section aria-label="Profile" className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <Image
        src={profile.avatarUrl}
        alt=""
        width={96}
        height={96}
        priority
        className="size-20 shrink-0 rounded-full border sm:size-24"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {profile.name ?? profile.login}
            </h1>
            <a
              href={profile.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:underline"
            >
              @{profile.login}
              <ExternalLinkIcon aria-hidden className="size-3.5" />
            </a>
          </div>
          <div className="flex gap-2">
            <CopyLinkButton path={`/u/${profile.login}`} />
            <Button variant="outline" nativeButton={false} render={<Link href={`/compare?users=${profile.login},`} />}>
              <ArrowLeftRightIcon aria-hidden className="size-4" />
              Compare
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={profile.htmlUrl} target="_blank" rel="noreferrer" />}
              className="hidden sm:inline-flex"
            >
              View on GitHub
            </Button>
          </div>
        </div>
        {profile.bio ? <p className="max-w-2xl text-pretty">{profile.bio}</p> : null}
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          <MetaItem icon={UsersIcon}>
            <strong className="font-medium text-foreground">{formatCompact(profile.followers)}</strong> followers ·{' '}
            <strong className="font-medium text-foreground">{formatCompact(profile.following)}</strong> following
          </MetaItem>
          {profile.company ? <MetaItem icon={BuildingIcon}>{profile.company}</MetaItem> : null}
          {profile.location ? <MetaItem icon={MapPinIcon}>{profile.location}</MetaItem> : null}
          {profile.websiteUrl ? (
            <MetaItem icon={LinkIcon}>
              <a
                href={withProtocol(profile.websiteUrl)}
                target="_blank"
                rel="noreferrer nofollow"
                className="underline-offset-4 hover:underline"
              >
                {profile.websiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
              </a>
            </MetaItem>
          ) : null}
          <MetaItem icon={CalendarIcon}>Joined {formatMonthYear(profile.createdAt.slice(0, 7))}</MetaItem>
        </ul>
      </div>
    </section>
  );
}
