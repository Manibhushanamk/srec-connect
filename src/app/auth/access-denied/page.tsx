import { redirect } from 'next/navigation';

export default function AuthAccessDeniedRedirect() {
  redirect('/access-denied');
}
