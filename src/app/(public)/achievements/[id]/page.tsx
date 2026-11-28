import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveAchievementCardProof } from '@/lib/admin-auth';
import { ProofPreview } from '@/components/shared/ProofPreview';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Shield,
  Sparkles,
  Trophy,
  User,
  Users,
} from 'lucide-react';

interface AchievementDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AchievementDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const ach = await prisma.achievement.findUnique({
    where: { id, deletedAt: null },
    select: { title: true, personName: true, organizationEventName: true },
  });
  if (!ach) return { title: 'Achievement Not Found' };
  return {
    title: `${ach.title} — ${ach.personName}`,
    description: `${ach.personName} • ${ach.organizationEventName} • SREC Connect Verified Achievement`,
  };
}

export default async function AchievementDetailPage({ params }: AchievementDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions).catch(() => null);

  let viewer: { id: string; role: string; departmentId: string | null } | null = null;
  if (session?.user?.email) {
    viewer = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, role: true, departmentId: true },
    });
  }

  const achievement = await prisma.achievement.findUnique({
    where: { id, deletedAt: null },
    include: {
      category: true,
      department: true,
      primaryStudent: {
        select: { id: true, rollNumber: true, name: true, user: { select: { id: true } } },
      },
      faculty: {
        select: { id: true, name: true, designation: true, user: { select: { id: true } } },
      },
      teamMembers: true,
      media: { take: 4 },
    },
  });

  if (!achievement) {
    notFound();
  }

  const isPubliclyApproved = achievement.status === 'APPROVED' || achievement.status === 'PUBLISHED';
  const isOwner =
    Boolean(viewer) &&
    (achievement.createdById === viewer!.id ||
      achievement.primaryStudent?.user?.id === viewer!.id ||
      achievement.faculty?.user?.id === viewer!.id);
  const isGlobalAdmin = viewer?.role === 'SUPER_ADMIN' || viewer?.role === 'ADMIN';
  const isSameDeptReviewer =
    Boolean(viewer?.departmentId) &&
    achievement.departmentId === viewer!.departmentId &&
    (viewer?.role === 'FACULTY' || viewer?.role === 'HOD' || viewer?.role === 'WEB_MANAGER');

  if (!isPubliclyApproved && !isOwner && !isGlobalAdmin && !isSameDeptReviewer) {
    notFound();
  }

  const proofProps = resolveAchievementCardProof(achievement, viewer);
  const resolvedProofUrl = proofProps.visibleProofUrl || proofProps.coverImageUrl;
  const rawProof = proofProps.hasPrivateProof;

  const parsedTags = achievement.tags
    ? achievement.tags.split(/[,;#]/).map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/achievements"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Honors Wall</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isPubliclyApproved ? 'Verified SREC Honor' : achievement.status}</span>
        </span>
      </div>

      {/* Main Dossier Card */}
      <div className="glass-card rounded-3xl overflow-hidden border border-border">
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary/25 text-blue-200 border border-primary/40">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{achievement.category?.name || 'Academic Honor'}</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/10 text-slate-100 border border-white/15 inline-flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-300" />
              <span>{achievement.level}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            {achievement.title}
          </h1>
          <p className="text-sm text-slate-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#F97316] shrink-0" />
            <span>{achievement.organizationEventName}</span>
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Recipient Strip */}
          <div className="p-4 rounded-2xl bg-secondary/45 border border-border flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black flex items-center justify-center text-lg">
                {achievement.personName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-foreground">{achievement.personName}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-background border border-border text-foreground">
                    {achievement.personType}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                  {(achievement.primaryStudentRoll || achievement.primaryStudent?.rollNumber) && (
                    <span className="font-mono text-foreground font-semibold inline-flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      {achievement.primaryStudentRoll || achievement.primaryStudent?.rollNumber}
                    </span>
                  )}
                  <span>•</span>
                  <span>{achievement.department?.name || achievement.departmentName || 'Santhiram Engineering College'}</span>
                </p>
              </div>
            </div>

            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-background border border-border inline-flex items-center gap-1.5">
              {achievement.participationType === 'TEAM' ? (
                <Users className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
              <span>{achievement.participationType === 'TEAM' ? 'Team Entry' : 'Solo Entry'}</span>
            </span>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-center">
              <p className="text-base font-black text-foreground">{achievement.positionRank || 'Recognized'}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Rank / Award</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 text-center">
              <p className="text-base font-black text-primary">{achievement.level}</p>
              <p className="text-[10px] uppercase font-bold text-primary mt-0.5">Competition Level</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-center">
              <p className="text-base font-black text-foreground">{achievement.academicYear}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Academic Year</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-center">
              <p className="text-base font-black text-foreground inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{formatDate(achievement.achievementDate)}</span>
              </p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Date Conferred</p>
            </div>
          </div>

          {achievement.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Honor Summary &amp; Abstract
              </h3>
              <p className="p-4 rounded-2xl bg-background border border-border text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                {achievement.description}
              </p>
            </div>
          )}

          {achievement.teamMembers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Team Collaborators ({achievement.teamMembers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {achievement.teamMembers.map((member) => (
                  <span
                    key={member.id}
                    className="px-3 py-1.5 rounded-xl bg-secondary/50 border border-border text-xs font-medium text-foreground"
                  >
                    {member.studentName} <span className="font-mono text-primary">({member.rollNumber})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {parsedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-muted border border-border text-foreground"
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {/* Embedded Proof Document Preview */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>Official Certificate &amp; Proof Preview</span>
              </h3>
              {resolvedProofUrl && (
                <a
                  href={resolvedProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Original Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <ProofPreview
              url={resolvedProofUrl}
              restricted={!resolvedProofUrl && Boolean(rawProof)}
              restrictedMessage="This certificate proof is protected under student privacy rules. Sign in as the Scholar Owner, Department Faculty Reviewer, HOD, or Super Admin to view it."
              title={achievement.title}
              heightClass="h-[440px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
