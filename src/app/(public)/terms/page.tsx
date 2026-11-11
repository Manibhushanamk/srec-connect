import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LegalTableOfContents, TocSection } from '@/components/legal/LegalTableOfContents';
import { Footer } from '@/components/layout/Footer';
import {
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Mail,
  UserCheck,
  Scale,
  Award,
  UploadCloud,
  Ban,
  BookOpen,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | SREC CONNECT',
  description:
    'Official Terms of Service for SREC CONNECT at Santhiram Engineering College (Autonomous), Nandyal. Outlines student rights, code of conduct, certificate submission rules, and platform governance.',
  openGraph: {
    title: 'Terms of Service | SREC CONNECT',
    description: 'Institutional Terms of Service governing the use of the SREC CONNECT academic platform and digital achievement ledger.',
    url: 'https://connect-srec.vercel.app/terms',
    siteName: 'SREC CONNECT',
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const SECTIONS: TocSection[] = [
  { id: 'acceptance', number: '1', title: 'Acceptance of Terms' },
  { id: 'eligibility', number: '2', title: 'Platform Purpose & Eligibility' },
  { id: 'account-responsibilities', number: '3', title: 'Student & User Account Responsibilities' },
  { id: 'google-authentication', number: '4', title: 'Google Account Authentication' },
  { id: 'accurate-information', number: '5', title: 'Accuracy of Academic Information' },
  { id: 'upload-rules', number: '6', title: 'Rules for Uploading Certificates & Documents' },
  { id: 'prohibited-activities', number: '7', title: 'Prohibited Activities & Platform Misuse' },
  { id: 'intellectual-property', number: '8', title: 'Intellectual Property & Document Ownership' },
  { id: 'verification-process', number: '9', title: 'Academic Record Accuracy & Verification Workflow' },
  { id: 'admin-responsibilities', number: '10', title: 'Administrator Responsibilities' },
  { id: 'suspension-termination', number: '11', title: 'Account Suspension & Termination' },
  { id: 'availability-maintenance', number: '12', title: 'Platform Availability & Scheduled Maintenance' },
  { id: 'limitation-of-liability', number: '13', title: 'Limitation of Institutional Liability' },
  { id: 'third-party-services', number: '14', title: 'Third-Party Services' },
  { id: 'changes-to-terms', number: '15', title: 'Modifications to Terms' },
  { id: 'contact-support', number: '16', title: 'Contact & Institutional Support' },
];

export default function TermsOfServicePage() {
  const lastUpdatedDate = 'November 11, 2026';

  return (
    <div className="w-full space-y-10">
      {/* 1. Institutional Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-space-900 via-space-950 to-brand-950/40 border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyan" size="md" glow className="gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Institutional Agreement
            </Badge>
            <Badge variant="slate" size="md">
              Version 3.0 Production
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Last Updated: {lastUpdatedDate}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            Terms of Service
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            These Terms of Service constitute a legally binding institutional agreement between you and{' '}
            <strong className="text-foreground">Santhiram Engineering College (Autonomous), Nandyal</strong>, governing
            your access to and use of the <strong className="text-foreground">SREC CONNECT</strong> digital platform.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Autonomous Institutional Bylaws</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-primary" />
              <span>Support Contact: manibhushanam4k@gmail.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Layout: Sticky TOC + Legal Content */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Table of Contents (Client Component) */}
        <LegalTableOfContents sections={SECTIONS} currentPage="terms" />

        {/* Content Body */}
        <article className="flex-1 w-full min-w-0 space-y-12 text-sm sm:text-base leading-relaxed text-foreground/90">
          {/* Section 1 */}
          <section id="acceptance" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Acceptance of Terms
              </h2>
            </div>
            <p>
              By accessing, browsing, registering for, or using the <strong className="text-foreground">SREC CONNECT</strong>{' '}
              platform at{' '}
              <a href="https://connect-srec.vercel.app" className="text-primary underline font-medium">
                https://connect-srec.vercel.app
              </a>
              , you confirm that you have read, understood, and agree to be bound by these Terms of Service, along with our{' '}
              <Link href="/privacy" className="text-primary underline font-medium">
                Privacy Policy
              </Link>{' '}
              and the institutional code of conduct established by Santhiram Engineering College (Autonomous).
            </p>
            <p className="text-muted-foreground text-sm">
              If you do not agree to these Terms, you must immediately refrain from accessing or using SREC CONNECT.
            </p>
          </section>

          {/* Section 2 */}
          <section id="eligibility" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Platform Purpose & Eligibility
              </h2>
            </div>
            <p>
              SREC CONNECT is an institutional collegiate software ecosystem designed exclusively for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
              <li>Currently enrolled undergraduate and postgraduate students of Santhiram Engineering College.</li>
              <li>Active faculty members, academic mentors, and research scholars.</li>
              <li>Department Heads (HOD), Academic Coordinators, and authorized College Administrative Officers.</li>
              <li>Official campus recruiters and NAAC/NBA accreditation evaluators (authorized public directory access only).</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              By using SREC CONNECT, you represent and warrant that you are an eligible affiliate of Santhiram Engineering
              College or an authorized external verifier.
            </p>
          </section>

          {/* Section 3 */}
          <section id="account-responsibilities" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Student & User Account Responsibilities
              </h2>
            </div>
            <p>
              Users of SREC CONNECT are entrusted with individual academic accounts linked to their permanent roll numbers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
              <li>
                <strong className="text-foreground">Confidentiality of Credentials:</strong> You are strictly responsible for
                safeguarding your authenticated session and device. You must not share access tokens, login credentials, or device
                sessions with other peers.
              </li>
              <li>
                <strong className="text-foreground">Account Non-Transferability:</strong> Accounts are assigned personally to
                specific student roll numbers or faculty identity records. You may not assign, transfer, or sell your account.
              </li>
              <li>
                <strong className="text-foreground">Accountability:</strong> You are legally and academically accountable for all
                actions, uploads, posts, comments, and grievance submissions performed under your account.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="google-authentication" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                4
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Google Account Authentication
              </h2>
            </div>
            <p>
              SREC CONNECT uses Google OAuth 2.0 to authenticate authorized campus affiliates. By authenticating via Google:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
              <li>You agree to adhere to Google's Terms of Service and applicable Acceptable Use Policies.</li>
              <li>
                You authorize SREC CONNECT to read your name, email, avatar, and grant scoped access (<code>drive.file</code>)
                for document and certificate uploads.
              </li>
              <li>
                You understand that revoking Google permissions or having your institutional Google account suspended will
                prevent further authentication into SREC CONNECT.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="accurate-information" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                5
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Accuracy of Academic Information
              </h2>
            </div>
            <p>
              Integrity is the bedrock of SREC CONNECT. Every user commits to absolute truthfulness in the submission of:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
              <li>Official SREC Roll Numbers, departmental affiliations, academic batches, and sections.</li>
              <li>Award descriptions, rank placements (1st/2nd/3rd prize), and monetary prize amounts.</li>
              <li>Team members and collaborators credited on joint hackathons, projects, or publications.</li>
            </ul>
            <Card variant="bento" className="p-4 bg-rose-500/5 border-rose-500/30">
              <p className="font-bold text-rose-500 text-sm flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Zero Tolerance for Academic Dishonesty</span>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Willful falsification, credential fabrication, or submitting photoshopped/altered certificates constitutes gross
                academic misconduct under Santhiram Engineering College Institutional Disciplinary Regulations, punishable by
                immediate suspension, grade penalties, and disciplinary hearings before the Academic Council.
              </p>
            </Card>
          </section>

          {/* Section 6 */}
          <section id="upload-rules" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                6
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Rules for Uploading Certificates & Documents
              </h2>
            </div>
            <p>
              When uploading proof documents, certificates, or letters of recognition, you agree to comply with the following technical
              and institutional constraints:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm my-4">
              <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
                <span className="font-bold text-primary block">Allowed File Formats</span>
                <span className="text-muted-foreground text-xs">
                  PDF, PNG, JPG, JPEG, WEBP, DOCX, and TXT. Executable files (<code>.exe</code>, <code>.sh</code>, <code>.bat</code>)
                  are strictly blocked.
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
                <span className="font-bold text-cyan-400 block">Strict File Size Limits</span>
                <span className="text-muted-foreground text-xs">
                  Google Drive Certificate uploads: Maximum <strong>15 MB</strong>. General media uploads: Maximum <strong>20 MB</strong>.
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
                <span className="font-bold text-emerald-400 block">Legitimate Academic Proof</span>
                <span className="text-muted-foreground text-xs">
                  Only official certificates of participation, merit awards, patent grant letters, or published research papers may be attached.
                </span>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="prohibited-activities" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                7
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Prohibited Activities & Platform Misuse
              </h2>
            </div>
            <p>You may not engage in any of the following activities on SREC CONNECT:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
              <li>
                <strong className="text-foreground">System Tampering:</strong> Attempting to probe, scan, or test the vulnerability of
                any SREC CONNECT system or breach authentication barriers.
              </li>
              <li>
                <strong className="text-foreground">Impersonation:</strong> Posing as another student, faculty member, Head of Department,
                or administrative officer.
              </li>
              <li>
                <strong className="text-foreground">Automated Scraping:</strong> Deploying automated spiders, crawlers, or screen-scrapers
                to harvest student email addresses, roll numbers, or profile information.
              </li>
              <li>
                <strong className="text-foreground">Abusive Grievances:</strong> Submitting defamatory, profane, false, harassing, or
                malicious grievance reports against faculty members, administrators, or peers.
              </li>
              <li>
                <strong className="text-foreground">Malicious Payloads:</strong> Uploading files containing malware, viruses, trojans,
                corrupted data, or unauthorized tracking scripts.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="intellectual-property" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                8
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Intellectual Property & Document Ownership
              </h2>
            </div>
            <p>
              <strong className="text-foreground">Student Ownership:</strong> Enrolled scholars retain full intellectual property
              rights and ownership over their original research papers, hackathon prototypes, code repositories, and original creative
              achievements.
            </p>
            <p>
              <strong className="text-foreground">Institutional License to SREC:</strong> By uploading achievement proof documents to
              SREC CONNECT, you grant Santhiram Engineering College a non-exclusive, worldwide, royalty-free institutional license to
              store, display, verify, and cite your achievements for:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground text-sm">
              <li>Accreditation compliance reviews with NAAC, NBA, NIRF, and AICTE.</li>
              <li>Official college newsletters, annual reports, departmental brochures, and website highlights.</li>
              <li>Placement brochures presenting student body achievements to prospective employers.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="verification-process" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                9
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Academic Record Accuracy & Verification Workflow
              </h2>
            </div>
            <p>
              To ensure that only legitimate honors are published on the official college ledger, SREC CONNECT operates a multi-stage
              verification workflow:
            </p>
            <div className="p-4 rounded-2xl bg-card border border-border space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Verification Stages</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                <strong>1. Student Submission:</strong> The scholar enters achievement metadata and uploads proof documents. Status: <code>PENDING</code>.
                <br />
                <strong>2. Faculty Mentorship Review:</strong> Assigned department faculty audit certificate legitimacy and event authenticity.
                <br />
                <strong>3. HOD Endorsement:</strong> The Head of Department reviews escalated records and endorses institutional recognition.
                <br />
                <strong>4. Publication:</strong> The achievement is marked <code>PUBLISHED</code> and added to the official department directory.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              The college reserves the right to unpublish, retract, or flag any previously approved achievement if evidence emerges
              of misrepresentation or error.
            </p>
          </section>

          {/* Section 10 */}
          <section id="admin-responsibilities" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                10
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Administrator Responsibilities
              </h2>
            </div>
            <p>
              Faculty members, Department Heads, and System Administrators exercising elevated permissions on SREC CONNECT agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
              <li>Conduct impartial, objective evaluations of student achievement claims without personal bias.</li>
              <li>Treat student grievance reports with absolute confidentiality and protect students from retaliation.</li>
              <li>Uphold the integrity of forensic audit logs and refrain from unlogged manual database overrides.</li>
              <li>Respect student privacy boundaries in accordance with institutional policy and the Privacy Policy.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section id="suspension-termination" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                11
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Account Suspension & Termination
              </h2>
            </div>
            <p>
              Santhiram Engineering College reserves the right to suspend, deactivate, or terminate user access to SREC CONNECT in
              cases of:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground text-sm">
              <li>Severe violations of these Terms of Service or institutional codes of conduct.</li>
              <li>Submitting forged documents or engaging in academic dishonesty.</li>
              <li>Attempted unauthorized penetration testing, vulnerability exploitation, or denial of service attacks.</li>
              <li>Graduation, withdrawal, transfer, or termination of employment at Santhiram Engineering College.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Suspended accounts are quarantined via the platform's soft-delete engine, immediately removing all public profile
              visibility while preserving audit records for disciplinary review.
            </p>
          </section>

          {/* Section 12 */}
          <section id="availability-maintenance" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                12
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Platform Availability & Scheduled Maintenance
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              SREC CONNECT is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. While we strive for continuous availability,
              Santhiram Engineering College does not guarantee uninterrupted or error-free uptime. Routine system maintenance,
              database indexing, security patches, and network upgrades may occasionally require temporary downtime. We endeavor
              to schedule major maintenance windows during off-peak hours.
            </p>
          </section>

          {/* Section 13 */}
          <section id="limitation-of-liability" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                13
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Limitation of Institutional Liability
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              To the maximum extent permitted under applicable law, Santhiram Engineering College, its administrators, faculty, and
              developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground text-sm">
              <li>Your use of or inability to access SREC CONNECT during technical outages.</li>
              <li>Unauthorized access to or alteration of your transmissions or data resulting from compromised personal Google credentials.</li>
              <li>Outages or policy changes by third-party providers (Google APIs, Vercel, Neon, Cloudflare).</li>
              <li>Disputes between students and external hackathons or competitions.</li>
            </ul>
          </section>

          {/* Section 14 */}
          <section id="third-party-services" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                14
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Third-Party Services
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              SREC CONNECT interacts with external platforms including Google OAuth, Google Drive, Cloudflare R2, Neon PostgreSQL,
              and Vercel. Your use of features dependent on these services is subject to their respective terms and conditions.
              SREC is not responsible for the independent operational practices or availability of these third-party services.
            </p>
          </section>

          {/* Section 15 */}
          <section id="changes-to-terms" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                15
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Modifications to Terms
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Santhiram Engineering College reserves the right to amend these Terms of Service at any time. When changes occur,
              the revised document will be posted on this page with an updated <strong className="text-foreground">Last Updated</strong>{' '}
              date. Continued access to SREC CONNECT following published modifications constitutes your binding acceptance of the
              updated Terms.
            </p>
          </section>

          {/* Section 16 */}
          <section id="contact-support" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-sm">
                16
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Contact & Institutional Support
              </h2>
            </div>
            <p>
              For questions concerning these Terms of Service, platform governance, or reporting violations, please contact our
              institutional administration:
            </p>

            <Card variant="glass" className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    Google Support & Developer Contact
                  </span>
                  <p className="font-mono text-primary font-semibold">manibhushanam4k@gmail.com</p>
                  <p className="text-xs text-muted-foreground">Official Google API Developer & Platform Lead</p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" />
                    College Academic Administration
                  </span>
                  <p className="text-foreground font-medium">Principal & Disciplinary Council</p>
                  <p className="text-xs text-muted-foreground">principal@srec.ac.in | admin@srec.ac.in</p>
                  <p className="text-xs text-muted-foreground">Phone: +91 8514 275 200</p>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <strong className="text-foreground">Campus Address:</strong> Santhiram Engineering College (Autonomous),
                  NH-40, Nandyal, Kurnool District, Andhra Pradesh - 518501, India.
                </div>
              </div>
            </Card>
          </section>

          {/* Cross Link to Privacy Policy */}
          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Review how your academic and personal information is protected.
            </span>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
            >
              <span>View Privacy Policy</span>
              <Shield className="w-3.5 h-3.5" />
            </Link>
          </div>
        </article>
      </div>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}
