'use client';

import React, { useRef } from 'react';
import { Printer, Shield, Download, FileText, CheckCircle2, AlertTriangle, Building, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export interface OfficialActionLetterProps {
  letterRef?: string;
  incidentTitle: string;
  category: string;
  outcome: string;
  notes?: string;
  issuedAt?: string | Date;
  student: {
    name: string;
    rollNumber: string;
    departmentName?: string;
    currentYear?: number;
    section?: string;
    batch?: string;
  };
  reporter: {
    name: string;
    role: string;
  };
  authority?: {
    name: string;
    designation: string;
  };
  onClose?: () => void;
}

export const OfficialActionLetter: React.FC<OfficialActionLetterProps> = ({
  letterRef = 'SREC/CSE-AIML/DISC/2026/' + Math.floor(1000 + Math.random() * 9000),
  incidentTitle,
  category,
  outcome,
  notes,
  issuedAt = new Date(),
  student,
  reporter,
  authority = {
    name: 'Dr. C. Ramanjaneyulu',
    designation: 'Professor & Head of Department, CSE (AI & ML)',
  },
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const outcomeTitleMap: Record<string, string> = {
    VERBAL_WARNING: 'OFFICIAL RECORD OF VERBAL ADVISORY',
    WRITTEN_WARNING: 'FORMAL DISCIPLINARY WRITTEN WARNING',
    COUNSELLING: 'ACADEMIC & CONDUCT COUNSELLING DIRECTIVE',
    CORRECTIVE_TASK: 'CORRECTIVE INSTITUTIONAL TASK ORDER',
    HOD_REVIEW: 'DEPARTMENTAL HOD FORMAL REVIEW ORDER',
    FORMAL_ACTION: 'INSTITUTIONAL DISCIPLINARY ACTION DECREE',
    NO_ACTION: 'FORMAL CASE DISMISSAL & EXONERATION MEMO',
  };

  const outcomeLabel = outcomeTitleMap[outcome] || 'OFFICIAL DISCIPLINARY ACTION ORDER';

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between print:hidden p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">Official Institutional Letter Document</span>
          <Badge variant="cyan" size="sm">{letterRef}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-400">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div
        ref={printRef}
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl border border-slate-200 max-w-3xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 font-serif"
      >
        {/* SREC Official Header */}
        <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
          <div className="flex justify-center items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center font-sans font-black text-xs text-slate-900">
              SREC
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight font-sans uppercase text-slate-950">
                Santhiram Engineering College (Autonomous)
              </h1>
              <p className="text-[11px] font-sans text-slate-600">
                Approved by AICTE, New Delhi • Permanently Affiliated to JNTUA, Ananthapuramu
              </p>
              <p className="text-[10px] font-sans text-slate-500">
                NH-40, Nandyal – 518501, Kurnool District, Andhra Pradesh, India
              </p>
            </div>
          </div>
          <div className="py-1 px-3 bg-slate-100 rounded inline-block font-sans text-[11px] font-bold text-slate-800 tracking-wider uppercase border border-slate-300">
            Department of Computer Science and Engineering (AI & ML)
          </div>
        </div>

        {/* Letter Metadata */}
        <div className="flex justify-between items-start text-xs font-sans text-slate-700 pt-6 pb-4">
          <div>
            <p className="font-bold text-slate-900">Ref. No: <span className="font-mono text-slate-800">{letterRef}</span></p>
            <p>Category: <span className="font-semibold">{category.replace(/_/g, ' ')}</span></p>
          </div>
          <div className="text-right">
            <p>Date of Issue: <span className="font-semibold">{formatDate(issuedAt)}</span></p>
            <p>Academic Year: <span className="font-semibold">{student.batch || '2026–2027'}</span></p>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center my-6">
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-950 underline decoration-2 underline-offset-4">
            {outcomeLabel}
          </h2>
        </div>

        {/* Recipient Block */}
        <div className="text-xs space-y-1 font-sans bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          <p className="font-bold text-slate-900">To:</p>
          <p className="text-sm font-bold text-slate-950">{student.name}</p>
          <p className="text-slate-700">Permanent Roll Number: <span className="font-mono font-bold text-slate-900">{student.rollNumber}</span></p>
          <p className="text-slate-700">Department: {student.departmentName || 'CSE (AI & ML)'}</p>
          {student.currentYear && (
            <p className="text-slate-700">Year / Section: Year {student.currentYear} - Section {student.section || 'A'}</p>
          )}
        </div>

        {/* Subject */}
        <div className="text-xs font-sans mb-4">
          <p className="font-bold text-slate-900">
            Subject: Official Action & Directive Concerning Incident &quot;{incidentTitle}&quot;
          </p>
        </div>

        {/* Letter Body & Findings */}
        <div className="text-xs sm:text-sm leading-relaxed space-y-4 text-slate-800 text-justify">
          <p>
            This official communication is issued following an institutional review of the disciplinary incident reported
            under category <strong>{category.replace(/_/g, ' ')}</strong>. The report was formally registered by faculty authority{' '}
            <strong>{reporter.name}</strong> ({reporter.role}) and evaluated under Santhiram Engineering College academic conduct regulations.
          </p>

          <div className="p-3.5 bg-slate-100 rounded-lg border-l-4 border-slate-800 text-xs italic font-sans">
            <p className="font-semibold not-italic text-slate-900 mb-1">Matter of Record:</p>
            &quot;{notes || 'Disciplinary violation observed during departmental academic schedules. Student provided opportunity to submit written representation.'}&quot;
          </div>

          <p>
            Upon comprehensive examination of the case dossier, student right-to-respond representations, and faculty records,
            the Departmental Disciplinary Authority has ordered the following formal outcome:
          </p>

          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 font-sans">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Official Determination: {outcome.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-amber-900">
              The student is hereby advised that this determination has been entered into the departmental student record.
              Future recurrence of similar infractions will lead to escalated administrative action under college autonomous statute.
            </p>
          </div>

          <p>
            The student is instructed to adhere strictly to department academic standards, maintain punctuality,
            and respect institutional conduct codes at all times.
          </p>
        </div>

        {/* Signature Blocks */}
        <div className="pt-16 grid grid-cols-2 gap-8 text-xs font-sans text-slate-900">
          <div className="space-y-1">
            <div className="w-32 border-b border-slate-400 mb-2" />
            <p className="font-bold">{reporter.name}</p>
            <p className="text-slate-600 text-[11px]">Reporting Faculty Authority</p>
            <p className="text-slate-500 text-[10px]">Department of CSE (AI & ML)</p>
          </div>

          <div className="text-right space-y-1">
            <div className="w-32 border-b border-slate-900 ml-auto mb-2" />
            <p className="font-bold text-slate-950">{authority.name}</p>
            <p className="text-slate-700 text-[11px] font-semibold">{authority.designation}</p>
            <p className="text-slate-600 text-[10px]">Santhiram Engineering College</p>
          </div>
        </div>

        {/* Official Department Seal watermark / stamp */}
        <div className="mt-10 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] font-sans text-slate-500">
          <span>SREC Connect Academic Platform • Autonomous System Record</span>
          <span className="font-mono">VERIFIED DOCUMENT #{letterRef}</span>
        </div>
      </div>
    </div>
  );
};
