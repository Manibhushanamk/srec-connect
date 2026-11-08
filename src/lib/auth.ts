import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { Role, AdminType } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, role: true, adminType: true, isRoot: true, status: true },
      });

      if (!existingUser) {
        return '/auth/access-denied';
      }

      if (existingUser.status !== 'ACTIVE') {
        return '/auth/access-denied';
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, role: true, adminType: true, isRoot: true, departmentId: true, studentId: true, facultyId: true },
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.adminType = dbUser.adminType;
          token.isRoot = dbUser.isRoot;
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
        (session.user as any).adminType = token.adminType;
        (session.user as any).isRoot = token.isRoot;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).studentId = token.studentId;
        (session.user as any).facultyId = token.facultyId;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/auth/access-denied')) return url;
      if (url.startsWith('/auth/error')) return url;
      
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getServerSession() {
  const { getServerSession: getSession } = await import('next-auth');
  return getSession(authOptions);
}

export function hasPermission(
  userRole: Role | undefined,
  userAdminType: AdminType | undefined,
  isRoot: boolean,
  requiredRole: Role,
  requiredAdminType?: AdminType
): boolean {
  if (!userRole) return false;
  if (isRoot) return true;
  
  if (userRole === Role.ADMIN) {
    if (requiredAdminType === AdminType.ROOT) return false;
    if (requiredAdminType === AdminType.DEPARTMENT && userAdminType === AdminType.DEPARTMENT) return true;
    if (requiredAdminType === AdminType.MANAGER && (userAdminType === AdminType.DEPARTMENT || userAdminType === AdminType.MANAGER)) return true;
    return userAdminType === requiredAdminType;
  }
  
  return userRole === requiredRole;
}

export function canManageDepartment(userDepartmentId: string | null, targetDepartmentId: string, isRoot: boolean): boolean {
  if (isRoot) return true;
  return userDepartmentId === targetDepartmentId;
}