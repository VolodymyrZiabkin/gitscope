// Trade-off: the instant skeleton matters more than the status code — a free-tier API can take up to a minute to
// wake up. Because streaming starts before the user is known, a missing user is served as a 200 page that Next.js
// marks `noindex`, so it never reaches search results.
export { DashboardSkeleton as default } from '@/pages/user-dashboard';
