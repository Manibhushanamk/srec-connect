import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import { Role } from '@prisma/client';
import { AuthUserContext } from './rbac';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return '/auth/access-denied?reason=missing_email';
      }

      const normalizedEmail = user.email.toLowerCase().trim();
      const initialAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || '').toLowerCase().trim();

      // 1. Domain Check against ApprovedEmailDomain allowlist
      const emailDomain = normalizedEmail.split('@')[1];
      const isInitialAdmin = initialAdminEmail && normalizedEmail === initialAdminEmail;

      if (!isInitialAdmin) {
        const approvedDomain = await prisma.approvedEmailDomain.findUnique({
          where: { domain: emailDomain },
        });

        if (!approvedDomain || !approvedDomain.isActive) {
          // If domain not yet configured in DB, allow institutional fallback or deny
          const institutionalDomain = 'srecnandyal.edu.in';
          if (emailDomain !== institutionalDomain) {
            console.warn(`[Auth] Rejected email domain: ${emailDomain}`);
            return '/auth/access-denied?reason=domain_not_allowed';
          }
        }
      }

      // 2. Pre-Provisioned User Match
      const dbUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          role: true,
          status: true,
        },
      });

      if (!dbUser) {
        // First Super Admin Auto-Bootstrap condition
        if (isInitialAdmin) {
          console.log(`[Auth] Auto-bootstrapping Initial Super Admin: ${normalizedEmail}`);
          await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: user.name || process.env.INITIAL_ADMIN_NAME || 'Super Administrator',
              role: Role.SUPER_ADMIN,
              status: 'ACTIVE',
              avatarUrl: user.image,
            },
          });
          return true;
        }

        console.warn(`[Auth] Unprovisioned sign-in attempt: ${normalizedEmail}`);
        return '/auth/access-denied?reason=not_provisioned';
      }

      // 3. Account Suspension Guard
      if (dbUser.status === 'SUSPENDED') {
        console.warn(`[Auth] Suspended user sign-in attempt: ${normalizedEmail}`);
        return '/auth/access-denied?reason=account_suspended';
      }

      // Update avatar if provided
      if (user.image) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { avatarUrl: user.image },
        }).catch(() => null);
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            role: true,
            status: true,
            departmentId: true,
            studentId: true,
            facultyId: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.departmentId = dbUser.departmentId;
          token.studentId = dbUser.studentId;
          token.facultyId = dbUser.facultyId;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).studentId = token.studentId;
        (session.user as any).facultyId = token.facultyId;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/auth/access-denied')) return url;
      if (url.startsWith('/auth/signin')) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/access-denied',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export async function getServerSession() {
  const { getServerSession: getSession } = await import('next-auth');
  return getSession(authOptions);
}
