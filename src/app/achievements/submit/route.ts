import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/dashboard/student/submit';
  return NextResponse.redirect(url);
}
