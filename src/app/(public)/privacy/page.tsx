import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LegalTableOfContents, TocSection } from '@/components/legal/LegalTableOfContents';
import { Footer } from '@/components/layout/Footer';
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Server,
  Cloud,
  Users,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Building2,
  Calendar,
  Key,
  FolderLock,
  Trash2,
  UserCheck,
  Scale,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | SREC CONNECT',
  description:
    'Official Privacy Policy for SREC CONNECT at Santhiram Engineering College (Autonomous), Nandyal. Learn how student information, Google OAuth authentication, and document storage are managed.',
  openGraph: {
    title: 'Privacy Policy | SREC CONNECT',
    description: 'Comprehensive Privacy Policy governing student records, Google OAuth authentication, and institutional document verification.',
    url: 'https://connect-srec.vercel.app/privacy',
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
  { id: 'introduction', number: '1', title: 'Introduction & Institutional Purpose' },
  { id: 'information-collected', number: '2', title: 'Information Collected & Stored' },
  { id: 'google-oauth', number: '3', title: 'Google OAuth Authentication' },
  { id: 'google-drive', number: '4', title: 'Google Drive Integration & Security Boundary' },
  { id: 'purpose-of-processing', number: '5', title: 'Purpose of Processing' },
  { id: 'rbac-permissions', number: '6', title: 'Data Access & Role-Based Permissions' },
  { id: 'confidential-records', number: '7', title: 'Confidentiality of Grievance & Disciplinary Records' },
  { id: 'third-party-services', number: '8', title: 'Third-Party Services & No Data Sale' },
  { id: 'retention-deletion', number: '9', title: 'Data Retention & Deletion Architecture' },
  { id: 'security-measures', number: '10', title: 'Technical & Security Controls' },
  { id: 'student-rights', number: '11', title: 'Student Rights & Rectification Requests' },
  { id: 'children-privacy', number: '12', title: "Children's Privacy" },
  { id: 'policy-changes', number: '13', title: 'Policy Amendments & Notice' },
  { id: 'contact-enquiries', number: '14', title: 'Contact Information & Inquiries' },
];

export default function PrivacyPolicyPage() {
  const lastUpdatedDate = 'November 11, 2026';
  const effectiveDate = 'November 11, 2026';

  return (
    <div className="w-full space-y-10">
      {/* 1. Institutional Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-space-900 via-space-950 to-brand-950/40 border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" size="md" glow className="gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Institutional Privacy Policy
            </Badge>
            <Badge variant="slate" size="md">
              Version 3.0 Production
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Last Updated: {lastUpdatedDate}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            Privacy Policy
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            This Privacy Policy details how <strong className="text-foreground">SREC CONNECT</strong>—the institutional
            student information, credentials verification, and achievement portfolio platform of{' '}
            <strong className="text-foreground">Santhiram Engineering College (Autonomous), Nandyal</strong>—collects,
            verifies, stores, and protects student and faculty information.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Santhiram Engineering College (Autonomous)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Google Support: manibhushanam4k@gmail.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Layout: Sticky TOC + Legal Content */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Table of Contents (Client Component) */}
        <LegalTableOfContents sections={SECTIONS} currentPage="privacy" />

        {/* Content Body */}
        <article className="flex-1 w-full min-w-0 space-y-12 text-sm sm:text-base leading-relaxed text-foreground/90">
          {/* Section 1 */}
          <section id="introduction" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Introduction & Institutional Purpose
              </h2>
            </div>
            <p>
              Welcome to <strong className="text-foreground">SREC CONNECT</strong> (accessible at{' '}
              <a href="https://connect-srec.vercel.app" className="text-primary underline font-medium">
                https://connect-srec.vercel.app
              </a>
              ). SREC CONNECT is the official campus academic portal developed and operated by{' '}
              <strong>Santhiram Engineering College (Autonomous)</strong>, located on NH-40, Nandyal, Andhra Pradesh -
              518501, India.
            </p>
            <p>
              The primary purpose of SREC CONNECT is to provide a single, verified, transparent digital ledger for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Recording and showcasing verified student academic, technical, cultural, and sports achievements.
              </li>
              <li>
                Supporting statutory institutional accreditation audits conducted by the National Assessment and
                Accreditation Council (<strong className="text-foreground">NAAC A+ Grade</strong>), the National Board of
                Accreditation (<strong className="text-foreground">NBA</strong>), and NIRF ranking frameworks.
              </li>
              <li>
                Facilitating authenticated student and faculty communication, departmental notices, and campus technical
                events.
              </li>
              <li>
                Providing confidential student grievance reporting and academic mentor resolution channels.
              </li>
            </ul>
            <p>
              We treat institutional scholar data with the highest ethical responsibility. We operate on a strict
              principle of data minimization and purpose limitation.
            </p>
          </section>

          {/* Section 2 */}
          <section id="information-collected" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Information Collected & Stored
              </h2>
            </div>
            <p>
              SREC CONNECT collects only the specific categories of data necessary to establish academic identity,
              validate official achievements, and administer institutional operations:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <Card variant="glass" className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <UserCheck className="w-4 h-4" />
                  <h4>Identity & Profile Information</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Student full name, institutional or approved personal email address, profile avatar image, professional
                  headline, biographical summary, and optional external profile links (LinkedIn, GitHub, or personal portfolio).
                </p>
              </Card>

              <Card variant="glass" className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Building2 className="w-4 h-4" />
                  <h4>Institutional Academic Anchors</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Permanent immutable SREC Roll Number (e.g., <code>22439EC024</code>), assigned Academic Department (e.g.,
                  Artificial Intelligence & Machine Learning, ECE, CSE), Academic Batch (e.g., <code>2022-2026</code>), and
                  Class Section (e.g., <code>A</code>).
                </p>
              </Card>

              <Card variant="glass" className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <FileText className="w-4 h-4" />
                  <h4>Achievements & Certificates</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Honors, awards, hackathon recognitions, publications, and conference presentations. Information includes event
                  title, issuing organization, competition level (International, National, State, University, College,
                  Department), award category, date, and submitted verification proof documents.
                </p>
              </Card>

              <Card variant="glass" className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <FolderLock className="w-4 h-4" />
                  <h4>Grievance & Disciplinary Records</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Confidential grievances, academic complaints, or behavioral incident reports formally submitted via the portal.
                  Includes issue description, severity tier, designated mentor/faculty assignment, and resolution timestamps.
                </p>
              </Card>
            </div>

            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Technical & Audit Metadata:</strong> Whenever users interact with SREC CONNECT,
              we record session authentication tokens, IP addresses, browser user-agent signatures, and timestamped forensic audit logs
              (<code>prisma.auditLog</code>) for security verification and tamper-evident administrative compliance.
            </p>
          </section>

          {/* Section 3 */}
          <section id="google-oauth" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Google OAuth Authentication
              </h2>
            </div>
            <p>
              SREC CONNECT utilizes <strong className="text-foreground">Google OAuth 2.0 / OpenID Connect</strong> as its primary
              secure authentication protocol, implemented through NextAuth.js.
            </p>

            <Card variant="bento" className="p-5 border-primary/30 space-y-3 bg-primary/5">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>Requested Google OAuth Scopes</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                During sign-in, SREC CONNECT requests the following standardized Google OAuth scopes:
              </p>
              <ul className="font-mono text-xs space-y-1.5 text-foreground/90 pl-4 list-disc">
                <li>
                  <code>openid</code> — Cryptographically verifies your identity.
                </li>
                <li>
                  <code>email</code> — Accesses your primary Google account email to map your identity to the institutional roster.
                </li>
                <li>
                  <code>profile</code> — Accesses your name and profile picture to populate your platform profile.
                </li>
                <li>
                  <code>https://www.googleapis.com/auth/drive.file</code> — Permits document uploads initiated specifically by you.
                </li>
              </ul>
            </Card>

            <p>
              <strong className="text-foreground">How authentication information is used:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground text-sm">
              <li>To verify that the person logging in is the legitimate account owner.</li>
              <li>To match the authenticated email against the pre-enrolled SREC student roll number or faculty registry.</li>
              <li>To issue cryptographic, tamper-resistant HTTP-only session cookies managed by NextAuth.js.</li>
              <li>We do <strong>not</strong> obtain, request, or store your personal Google password at any point.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="google-drive" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                4
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Google Drive Integration & Strict Security Boundary
              </h2>
            </div>

            <p>
              SREC CONNECT integrates with the official Google Drive API (<code>v3</code>) for verified achievement certificate
              storage and portfolio proof verification.
            </p>

            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">A. Scope Minimization (drive.file):</strong>
                <br />
                We intentionally request only the restricted <code>drive.file</code> scope. This scope grants SREC CONNECT access{' '}
                <strong>ONLY to files and folders created or opened by SREC CONNECT itself</strong>. SREC CONNECT does not have, and
                can never obtain, permission to view, read, index, edit, or delete any of your other personal Google Drive folders,
                personal spreadsheets, private photos, or personal documents.
              </p>

              <p>
                <strong className="text-foreground">B. Storage Architecture:</strong>
                <br />
                When you submit an academic achievement with a certificate attachment, the file is transferred into an organized folder
                structure: <code>SREC Connect / &lt;Student Name&gt; (&lt;Email&gt;)</code> or departmental academic year folders.
                Public certificate proofs are provided with view-only links so that campus recruiters, NAAC evaluators, and department
                heads can verify authenticity.
              </p>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Enforced Security Boundary: assertDriveAllowed()</span>
                </div>
                <p className="text-xs leading-relaxed">
                  In accordance with the platform's architectural security policy, confidential student grievance records, disciplinary
                  investigation files, and sensitive dispute records are{' '}
                  <strong className="underline">strictly prohibited from Google Drive disclosure</strong>. Any programmatic attempt to
                  route a disciplinary or grievance file to Google Drive triggers a blocking <code>DriveSecurityError</code> exception.
                  All confidential incident documents remain exclusively in private internal system storage with restricted mentor/HOD access.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="purpose-of-processing" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                5
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Purpose of Collecting Information
              </h2>
            </div>
            <p>SREC CONNECT collects and processes data strictly for legitimate educational and institutional activities:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
              <li>
                <strong className="text-foreground">Academic Portfolio & Verification:</strong> Building a verifiable digital record
                of each student's curricular and extracurricular achievements throughout their undergraduate or postgraduate tenure.
              </li>
              <li>
                <strong className="text-foreground">Accreditation & Regulatory Auditing:</strong> Compiling structured statistical metrics
                and verifiable documentation for statutory inspections by NAAC, NBA, AICTE, JNTUA, and autonomous college reviews.
              </li>
              <li>
                <strong className="text-foreground">Campus Event Administration:</strong> Facilitating registrations, generating
                attendance records via QR codes, and tracking symposium participation.
              </li>
              <li>
                <strong className="text-foreground">Student Grievance Redressal:</strong> Providing a secure, structured mechanism for
                students to voice grievances, seek mentorship, and receive official resolutions from department leaders.
              </li>
              <li>
                <strong className="text-foreground">Institutional Integrity:</strong> Preventing fraudulent or duplicate achievement
                claims through multi-tier verification workflows.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="rbac-permissions" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                6
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Data Access & Role-Based Permissions
              </h2>
            </div>
            <p>
              Access to student and faculty information is governed strictly by the SREC CONNECT Role-Based Access Control (RBAC) engine:
            </p>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="font-bold text-foreground block mb-1">Public Visitors (Unauthenticated)</span>
                <span className="text-muted-foreground">
                  May view only publicly approved and published achievements, public event announcements, published student directories,
                  and faculty research profiles. Cannot access student contact numbers, confidential grievance records, or admin desks.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="font-bold text-emerald-400 block mb-1">Enrolled Students</span>
                <span className="text-muted-foreground">
                  Can edit their own personal profile, submit achievement records, view personal certificates, and file confidential
                  grievance tickets. Cannot view grievance reports filed by other peers or modify academic batch records.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="font-bold text-cyan-400 block mb-1">Faculty Members & Mentors</span>
                <span className="text-muted-foreground">
                  Can review and endorse achievement claims submitted by students in their department, record event attendance, and
                  investigate grievances assigned to their mentorship cohort.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="font-bold text-brand-400 block mb-1">Head of Department (HOD) & Web Managers</span>
                <span className="text-muted-foreground">
                  Manage departmental rosters, approve escalated achievement records, oversee grievance resolutions, and inspect
                  department-level forensic audit logs.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="font-bold text-amber-400 block mb-1">Super Administrator</span>
                <span className="text-muted-foreground">
                  Holds system-wide configuration authority, manages the Trash system, oversees global security settings, and conducts
                  forensic audits across the database.
                </span>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="confidential-records" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                7
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Confidentiality of Grievance & Disciplinary Records
              </h2>
            </div>
            <p>
              We recognize the sensitive nature of student grievance submissions and disciplinary records. All grievance tickets
              are classified as <strong className="text-foreground">Strictly Confidential</strong>.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
              <li>Grievances are never indexed in public feeds or visible in public search queries.</li>
              <li>Only the student who submitted the ticket, the assigned faculty mentor, and the HOD have access to review the case.</li>
              <li>All administrative reviews and mentor responses are permanently timestamped in the case history.</li>
              <li>Supporting evidence attached to grievance files is sequestered from Google Drive and stored in protected storage.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="third-party-services" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                8
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Third-Party Services & No Data Sale
              </h2>
            </div>
            <p>
              SREC CONNECT engages select, industry-standard infrastructure providers to deliver its services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
              <li>
                <strong className="text-foreground">Google LLC:</strong> For Google OAuth 2.0 authentication and Google Drive API document
                storage. Subject to Google's Privacy Policy.
              </li>
              <li>
                <strong className="text-foreground">Cloudflare, Inc. (Cloudflare R2):</strong> High-durability object storage for
                institutional media and document mirrors.
              </li>
              <li>
                <strong className="text-foreground">Neon, Inc.:</strong> Managed PostgreSQL serverless database with automated backup and
                TLS encrypted database connectivity.
              </li>
              <li>
                <strong className="text-foreground">Vercel Inc.:</strong> Application edge hosting, automated builds, and content delivery
                network (CDN) services.
              </li>
            </ul>
            <Card variant="bento" className="p-4 bg-emerald-500/5 border-emerald-500/30">
              <p className="font-bold text-emerald-400 text-sm flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Explicit Commitment: Zero Data Commercialization</span>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                SREC CONNECT does <strong>NOT</strong> sell, rent, monetize, broker, or disclose student or faculty personal data to
                third-party marketers, advertising exchanges, or commercial data brokers under any circumstances.
              </p>
            </Card>
          </section>

          {/* Section 9 */}
          <section id="retention-deletion" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                9
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Data Retention & Deletion Architecture
              </h2>
            </div>
            <p>
              SREC CONNECT implements an intentional two-tier retention and deletion protocol:
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">1. Soft-Delete Sequestration:</strong>
                <br />
                When an administrator removes a student, faculty member, or post, the record's <code>deletedAt</code> timestamp is
                recorded in the database. Soft-deleted entities are instantly purged from public feeds, directories, search endpoints,
                and portfolio views. Relational cascades automatically isolate associated achievements and notifications.
              </p>
              <p>
                <strong className="text-foreground">2. Admin Trash & Permanent Purge:</strong>
                <br />
                Soft-deleted items reside in the restricted Admin Trash desk. Super Administrators can review quarantined items and
                execute permanent physical deletion from the PostgreSQL database.
              </p>
              <p>
                <strong className="text-foreground">3. Student Deletion Requests:</strong>
                <br />
                Graduating scholars or students withdrawing from the institution may request the full deletion of their digital profile
                and personal contact details by submitting a written request to the Department HOD or emailing{' '}
                <a href="mailto:manibhushanam4k@gmail.com" className="text-primary underline">
                  manibhushanam4k@gmail.com
                </a>
                . Note that aggregate academic metrics required for statutory accreditation records (NAAC/NBA) may be retained in
                de-identified form as required by college bylaws.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="security-measures" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                10
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Technical & Security Controls Actually Implemented
              </h2>
            </div>
            <p>
              Rather than generic security claims, SREC CONNECT implements concrete, verified technical protections:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <span className="font-bold text-foreground block">TLS/SSL Encryption</span>
                <span className="text-muted-foreground">
                  All HTTP traffic is strictly encrypted in transit using TLS 1.3 via Vercel edge endpoints and HSTS headers.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <span className="font-bold text-foreground block">Hardened Security Headers</span>
                <span className="text-muted-foreground">
                  Enforces <code>X-Frame-Options: DENY</code>, <code>X-Content-Type-Options: nosniff</code>, and strict referrer policies.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <span className="font-bold text-foreground block">Tamper-Evident Audit Logging</span>
                <span className="text-muted-foreground">
                  Every administrative promotion, deletion, drive upload, and status transition is recorded in <code>prisma.auditLog</code>.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <span className="font-bold text-foreground block">Database Parameterization</span>
                <span className="text-muted-foreground">
                  Prisma ORM ensures 100% parameterized SQL queries, eliminating SQL injection vectors.
                </span>
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section id="student-rights" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                11
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Student Rights & Rectification Requests
              </h2>
            </div>
            <p>Under SREC institutional policy, enrolled scholars have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground text-sm">
              <li>
                <strong className="text-foreground">Access:</strong> Review all personal information and uploaded certificates attached
                to their student profile.
              </li>
              <li>
                <strong className="text-foreground">Rectification:</strong> Request correction of misspelled names, incorrect batch
                designations, or misattributed achievements through their Department HOD or portal administrator.
              </li>
              <li>
                <strong className="text-foreground">Revocation of Google OAuth Access:</strong> Students may revoke SREC CONNECT's access
                to their Google account at any time via{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Account Security Settings
                </a>
                .
              </li>
            </ul>
          </section>

          {/* Section 12 */}
          <section id="children-privacy" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                12
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Children's Privacy
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              SREC CONNECT is an institutional collegiate portal intended solely for enrolled higher education engineering students,
              faculty members, and authorized educational staff (typically aged 17 and older). We do not knowingly collect or solicit
              personal information from children under the age of 13. If you believe a minor has improperly provided personal data,
              please contact our administration immediately for prompt record deletion.
            </p>
          </section>

          {/* Section 13 */}
          <section id="policy-changes" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                13
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Policy Amendments & Notice
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Santhiram Engineering College may update this Privacy Policy from time to time to reflect changes in institutional
              bylaws, platform capabilities, or legal requirements. All updates will be published on this page with an updated{' '}
              <strong className="text-foreground">Last Updated</strong> date. Significant revisions affecting data handling will be
              communicated through campus announcements or official email notifications.
            </p>
          </section>

          {/* Section 14 */}
          <section id="contact-enquiries" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm">
                14
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Contact Information & Privacy Enquiries
              </h2>
            </div>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information on SREC
              CONNECT, please contact our designated privacy and platform administrators:
            </p>

            <Card variant="glass" className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-primary" />
                    Google OAuth & Technical Support
                  </span>
                  <p className="font-mono text-primary font-semibold">manibhushanam4k@gmail.com</p>
                  <p className="text-xs text-muted-foreground">Primary developer and Google API Project Coordinator</p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Institutional Administration
                  </span>
                  <p className="text-foreground font-medium">Principal & Academic Cell</p>
                  <p className="text-xs text-muted-foreground">principal@srec.ac.in | admin@srec.ac.in</p>
                  <p className="text-xs text-muted-foreground">Phone: +91 8514 275 200</p>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <strong className="text-foreground">Mailing Address:</strong> Santhiram Engineering College (Autonomous),
                  NH-40, Nandyal, Kurnool District, Andhra Pradesh - 518501, India.
                </div>
              </div>
            </Card>
          </section>

          {/* Cross Link to Terms of Service */}
          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Please also review our Terms of Service governing your use of SREC CONNECT.
            </span>
            <Link
              href="/terms"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
            >
              <span>View Terms of Service</span>
              <FileText className="w-3.5 h-3.5" />
            </Link>
          </div>
        </article>
      </div>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}
