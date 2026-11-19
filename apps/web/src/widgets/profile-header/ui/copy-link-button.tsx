'use client';

import { CheckIcon, LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';

/** Copies the canonical profile link (without filter parameters) — that is the link with the preview card. */
export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = new URL(path, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link', url); // Clipboard API is unavailable on insecure origins.
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" onClick={() => void copy()}>
      {copied ? <CheckIcon aria-hidden className="size-4" /> : <LinkIcon aria-hidden className="size-4" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
    </Button>
  );
}
