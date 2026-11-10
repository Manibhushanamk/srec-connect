import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
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
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
        },
      },
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Campus Credentials',
      credentials: {
        email: { label: 'Email or Roll Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Security Guard: Disable credentials fallback in production
        if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CREDENTIALS_AUTH !== 'true') {
          console.warn('[Security] Credentials provider sign-in rejected in production mode. Use institutional Google OAuth.');
          return null;
        }

        const query = credentials.email.trim();
        const normalizedEmail = query.toLowerCase();

        // 1. Direct match by email or roll number
        let dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedEmail },
              { student: { rollNumber: query.toUpperCase() } },
            ],
          },
          include: {
            student: true,
            faculty: true,
          },
        });

        // 2. Initial Admin Auto-Bootstrap condition in dev
        if (!dbUser) {
          const initialAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || '').toLowerCase().trim();
          if (normalizedEmail === initialAdminEmail) {
            dbUser = await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: process.env.INITIAL_ADMIN_NAME || 'Super Administrator',
                role: Role.SUPER_ADMIN,
                status: 'ACTIVE',
              },
              include: {
                student: true,
                faculty: true,
              },
            });
          }
        }

        if (!dbUser || dbUser.status === 'SUSPENDED') {
          return null;
        }

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') {
        return true;
      }

      if (!user.email) {
        return '/access-denied?reason=missing_email';
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
            return '/access-denied?reason=domain_not_allowed';
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
          deletedAt: true,
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
        return '/access-denied?reason=not_provisioned';
      }

      // 3. Account Suspension / Soft-Delete Guard
      if (dbUser.deletedAt || dbUser.status === 'SUSPENDED') {
        console.warn(`[Auth] Inactive/Deleted user sign-in attempt: ${normalizedEmail}`);
        return '/access-denied?reason=account_suspended';
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

    async jwt({ token, user, account, trigger, session }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (account?.refresh_token) {
        token.refreshToken = account.refresh_token;
      }
      if (trigger === 'update') {
        if (session?.name) token.name = session.name;
        if (session?.image) token.picture = session.image;
      }

      // Always resolve and synchronize with live database user
      const lookupEmail = (user?.email || token.email)?.toLowerCase().trim();
      if (lookupEmail) {
        let dbUser = await prisma.user.findUnique({
          where: { email: lookupEmail },
          select: {
            id: true,
            name: true,
            role: true,
            status: true,
            departmentId: true,
            studentId: true,
            facultyId: true,
            avatarUrl: true,
            faculty: { select: { name: true, designation: true } },
            student: { select: { name: true } },
          },
        });

        // Relational Auto-Bond: Ensure student/faculty & department relations are never severed
        if (dbUser && (!dbUser.studentId || !dbUser.facultyId || !dbUser.departmentId)) {
          const updateData: any = {};
          if (!dbUser.studentId && dbUser.role === 'STUDENT') {
            const student = await prisma.student.findFirst({
              where: {
                OR: [
                  { email: lookupEmail },
                  { rollNumber: lookupEmail.split('@')[0].toUpperCase() },
                ],
              },
            });
            if (student) {
              updateData.studentId = student.id;
              if (!dbUser.name && student.name) updateData.name = student.name;
              if (!dbUser.departmentId && student.departmentId) {
                updateData.departmentId = student.departmentId;
              }
            }
          }

          if (!dbUser.facultyId && (dbUser.role === 'FACULTY' || dbUser.role === 'HOD')) {
            const faculty = await prisma.faculty.findFirst({
              where: { email: lookupEmail },
            });
            if (faculty) {
              updateData.facultyId = faculty.id;
              if (!dbUser.name && faculty.name) updateData.name = faculty.name;
              if (!dbUser.departmentId && faculty.departmentId) {
                updateData.departmentId = faculty.departmentId;
              }
            }
          }

          if (!dbUser.departmentId && !updateData.departmentId) {
            const defaultDept = await prisma.department.findFirst({
              where: { OR: [{ code: 'AIML' }, { code: 'CSE(AI&ML)' }] },
            });
            if (defaultDept) updateData.departmentId = defaultDept.id;
          }

          if (Object.keys(updateData).length > 0) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: updateData,
              select: {
                id: true,
                name: true,
                role: true,
                status: true,
                departmentId: true,
                studentId: true,
                facultyId: true,
                avatarUrl: true,
                faculty: { select: { name: true, designation: true } },
                student: { select: { name: true } },
              },
            });
          }
        }

        // Keep official verified academic name synchronized
        const officialAcademicName = dbUser?.name || dbUser?.faculty?.name || dbUser?.student?.name;
        if (dbUser && dbUser.facultyId && officialAcademicName && dbUser.faculty?.name !== officialAcademicName) {
          await prisma.faculty.update({
            where: { id: dbUser.facultyId },
            data: { name: officialAcademicName },
          }).catch(() => null);
        }

        if (dbUser) {
          token.id = dbUser.id;
          token.name = officialAcademicName || dbUser.name;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.departmentId = dbUser.departmentId;
          token.studentId = dbUser.studentId;
          token.facultyId = dbUser.facultyId;
          if (dbUser.avatarUrl) token.picture = dbUser.avatarUrl;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const lookupEmail = (session.user.email || token.email)?.toLowerCase().trim();
        if (lookupEmail) {
          const dbUser = await prisma.user.findUnique({
            where: { email: lookupEmail },
            select: {
              id: true,
              name: true,
              role: true,
              status: true,
              departmentId: true,
              studentId: true,
              facultyId: true,
              avatarUrl: true,
              faculty: { select: { name: true, designation: true } },
              student: { select: { name: true } },
            },
          }).catch(() => null);

          if (dbUser) {
            const liveName = dbUser.name || dbUser.faculty?.name || dbUser.student?.name;
            session.user.name = liveName || session.user.name;
            (session.user as any).id = dbUser.id;
            (session.user as any).role = dbUser.role;
            (session.user as any).status = dbUser.status;
            (session.user as any).departmentId = dbUser.departmentId;
            (session.user as any).studentId = dbUser.studentId;
            (session.user as any).facultyId = dbUser.facultyId;
            if (dbUser.avatarUrl) session.user.image = dbUser.avatarUrl;
            (session as any).accessToken = token.accessToken;
            return session;
          }
        }

        (session.user as any).id = token.id;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).studentId = token.studentId;
        (session.user as any).facultyId = token.facultyId;
      }
      (session as any).accessToken = token.accessToken;
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/access-denied')) return url;
      if (url.startsWith('/signin')) return `${baseUrl}/auth/landing`;
      if (url === baseUrl || url === '/' || url === '') return `${baseUrl}/auth/landing`;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return url;
    },
  },

  pages: {
    signIn: '/signin',
    error: '/access-denied',
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
