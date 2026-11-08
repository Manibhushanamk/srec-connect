import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { getRoleLandingUrl } from '@/lib/rbac';

export default async function AuthLandingPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/signin');
  }

  const role = (session.user as any)?.role;
  const email = session.user.email || '';
  const destination = getRoleLandingUrl(role, email);

  redirect(destination);
}
