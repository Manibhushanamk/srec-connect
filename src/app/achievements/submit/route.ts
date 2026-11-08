import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  const url = req.nextUrl.clone();
  if (user?.role === 'FACULTY' || user?.role === 'HOD') {
    url.pathname = '/dashboard/faculty/submit';
  } else {
    url.pathname = '/dashboard/student/submit';
  }
  return NextResponse.redirect(url);
}
