import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions).catch(() => null);
  const user = session?.user as any;

  const url = req.nextUrl.clone();
  const assistParam = req.nextUrl.searchParams.get('assist');

  if (
    assistParam === '1' ||
    user?.role === 'WEB_MANAGER' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'STUDENT'
  ) {
    url.pathname = '/dashboard/student/submit';
  } else if (user?.role === 'FACULTY' || user?.role === 'HOD') {
    url.pathname = '/dashboard/student/submit';
    url.searchParams.set('assist', '1');
  } else {
    url.pathname = '/dashboard/student/submit';
  }
  return NextResponse.redirect(url);
}
