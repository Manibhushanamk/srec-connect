'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface HodPendingItem {
  id: string;
  title: string;
  personName: string;
  primaryStudentRoll: string | null;
  status: string;
  level: string;
  createdById: string | null;
  organizationEventName: string;
}

interface HodPendingApprovalsWidgetProps {
  items: HodPendingItem[];
  currentUserId: string;
  currentUserRole: string;
  departmentLabel: string;
}

export function HodPendingApprovalsWidget({
  items: initialItems,
  currentUserId,
  currentUserRole,
  departmentLabel,
}: HodPendingApprovalsWidgetProps) {
  const [items, setItems] = useState(initialItems);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleFinalSignOff = async (item: HodPendingItem) => {
    setFeedback(null);
    setSigningId(item.id);
    try {
      const res = await fetch('/api/admin/achievements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: 'PUBLISHED' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'Final sign-off failed.' });
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setFeedback({
        type: 'ok',
        text: `Published "${item.title}" to Honors Wall with institutional audit log.`,
      });
    } catch {
      setFeedback({ type: 'err', text: 'Network error during HOD sign-off.' });
    } finally {
      setSigningId(null);
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#CA8A04] dark:text-[#FACC15]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-foreground">
              Final Approval Queue — {departmentLabel}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            One-click HOD sign-off publishes verified achievements with Solar Gold honor seal.
          </p>
        </div>
        <Link
          href="/admin/achievements?status=APPROVED"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>Open Verification Desk</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'err' ? 'alert' : 'status'}
          className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'ok'
              ? 'border-[#CA8A04]/40 dark:border-[#FACC15]/40 bg-[#CA8A04]/12 dark:bg-[#FACC15]/12 text-[#92400E] dark:text-[#FACC15]'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {feedback.type === 'err' ? (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
          All departmental honors awaiting final sign-off are cleared.
        </div>
      ) : (
        <ul className="space-y-2.5" role="list">
          {items.map((item) => {
            const isSelfSubmitted =
              Boolean(item.createdById) &&
              item.createdById === currentUserId &&
              currentUserRole !== 'SUPER_ADMIN';
            const isSigning = signingId === item.id;

            return (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl liquid-chip"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground truncate">
                      {item.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#CA8A04]/40 dark:border-[#FACC15]/40 bg-[#CA8A04]/12 dark:bg-[#FACC15]/12 text-[#92400E] dark:text-[#FACC15]">
                      {item.status === 'APPROVED' ? 'Awaiting HOD Sign-Off' : item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.personName}
                    {item.primaryStudentRoll ? ` (${item.primaryStudentRoll})` : ''} • {item.organizationEventName} • {item.level}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSelfSubmitted ? (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-amber-500/30 text-amber-400 bg-amber-500/10">
                      Self-Submitted (Blocked)
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isSigning}
                      onClick={() => handleFinalSignOff(item)}
                      className="text-xs bg-[#CA8A04] dark:bg-[#FACC15] hover:opacity-90 text-white dark:text-[#0D0E12] font-semibold"
                    >
                      {isSigning ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      <span>Final HOD Publish</span>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
