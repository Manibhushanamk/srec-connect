import { ReactNode } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canAccessAdmin } from '@/lib/rbac';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect('/signin?callbackUrl=/admin');
  }

  const user = session.user as any;
  if (!canAccessAdmin(user)) {
    redirect('/access-denied');
  }

  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}