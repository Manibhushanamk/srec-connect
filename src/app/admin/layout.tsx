import { ReactNode } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  const userRole = (session.user as any).role;
  const isRoot = (session.user as any).isRoot;
  
  if (userRole !== Role.ADMIN && !isRoot) {
    redirect('/auth/access-denied');
  }

  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}