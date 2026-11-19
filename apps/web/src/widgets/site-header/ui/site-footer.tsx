import { siteConfig } from '@/shared/config';

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Built by{' '}
          <a
            href="https://github.com/VolodymyrZiabkin"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Volodymyr Ziabkin
          </a>{' '}
          · Data from the GitHub GraphQL API
        </p>
        <a href={siteConfig.repositoryUrl} className="underline-offset-4 hover:underline">
          Source code
        </a>
      </div>
    </footer>
  );
}
