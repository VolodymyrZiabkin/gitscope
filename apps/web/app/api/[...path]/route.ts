import { proxyToApi } from '@/shared/server-api';

export async function GET(request: Request, { params }: RouteContext<'/api/[...path]'>) {
  const { path } = await params;
  const { search } = new URL(request.url);
  return proxyToApi(`/${path.join('/')}`, search, request);
}
