'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DriveFileUploader } from '@/components/drive/DriveFileUploader';
import { ProofPreview } from '@/components/shared/ProofPreview';
import { toPrivateDocumentUrl } from '@/lib/admin-auth';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { createCustomCategoryOption, removeCategoryOption } from '@/lib/client-creatable';
import {
  Award,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Search,
  Share2,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';

interface EditAchievementModalProps {
  editingItem: any | null;
  setEditingItem: React.Dispatch<React.SetStateAction<any | null>>;
  categories: any[];
  departments: any[];
  savingEdit: boolean;
  canManageCategories?: boolean;
  onCategoryRemoved?: (categoryId: string) => void;
  onSaveEdit: (publishImmediately?: boolean) => Promise<void>;
  onRejectAction: (id: string, status: 'REJECTED' | 'RESUBMISSION_REQUIRED', reason: string) => Promise<boolean>;
}

export function EditAchievementModal({
  editingItem,
  setEditingItem,
  categories,
  departments,
  savingEdit,
  canManageCategories = false,
  onCategoryRemoved,
  onSaveEdit,
  onRejectAction,
}: EditAchievementModalProps) {
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [uploadingFeedImg, setUploadingFeedImg] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [extraCategories, setExtraCategories] = useState<any[]>([]);
  const [removedCategoryIds, setRemovedCategoryIds] = useState<Set<string>>(new Set());
  const allCategories = React.useMemo(() => {
    const map = new Map<string, any>();
    [...categories, ...extraCategories].forEach((c) => {
      if (c?.id && !removedCategoryIds.has(c.id)) map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [categories, extraCategories, removedCategoryIds]);

  useEffect(() => {
    setMemberSearchQuery('');
    setMemberSearchResults([]);
    setShowMemberDropdown(false);
    setModalError(null);
  }, [editingItem?.id]);

  useEffect(() => {
    if (!memberSearchQuery.trim() || memberSearchQuery.trim().length < 2) {
      setMemberSearchResults([]);
      setShowMemberDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setMemberSearching(true);
      try {
        const res = await fetch(`/api/members/search?q=${encodeURIComponent(memberSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const students = (data.members || []).filter((m: any) => m.role === 'STUDENT' || m.rollNumber);
          setMemberSearchResults(students);
          setShowMemberDropdown(true);
        }
      } catch (err) {
        console.error('Failed to search students:', err);
      } finally {
        setMemberSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [memberSearchQuery]);

  if (!editingItem) return null;

  const previewUrl = toPrivateDocumentUrl(editingItem.certificateUrl || editingItem.googleDriveUrl);

  const handleAddTeamMember = (student: any) => {
    const currentMembers = editingItem.teamMembers || [];
    if (currentMembers.some((m: any) => m.rollNumber?.toUpperCase() === student.rollNumber?.toUpperCase())) {
      setModalError(`${student.name} (${student.rollNumber}) is already listed as a collaborator.`);
      return;
    }
    setModalError(null);
    setEditingItem({
      ...editingItem,
      teamMembers: [
        ...currentMembers,
        {
          studentId: student.studentId,
          userId: student.userId,
          rollNumber: student.rollNumber,
          studentName: student.name,
          detail: student.detail || student.departmentName || '',
        },
      ],
      participationType: 'TEAM',
    });
    setMemberSearchQuery('');
    setMemberSearchResults([]);
    setShowMemberDropdown(false);
  };

  const handleRemoveTeamMember = (index: number) => {
    const currentMembers = editingItem.teamMembers || [];
    setEditingItem({
      ...editingItem,
      teamMembers: currentMembers.filter((_: any, i: number) => i !== index),
    });
  };

  const handleFeedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFeedImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditingItem({ ...editingItem, feedImageUrl: data.url });
      } else {
        setModalError(data.error || 'Failed to upload photo');
      }
    } catch {
      setModalError('Upload failed');
    } finally {
      setUploadingFeedImg(false);
    }
  };

  const validateAndSubmit = async (publishImmediately: boolean) => {
    setModalError(null);
    if (
      !publishImmediately &&
      (editingItem.status === 'REJECTED' || editingItem.status === 'RESUBMISSION_REQUIRED') &&
      !(editingItem.rejectionReason || '').trim()
    ) {
      setModalError(
        editingItem.status === 'REJECTED'
          ? 'A rejection reason is mandatory before saving a Rejected status.'
          : 'Revision remarks are mandatory before requesting resubmission.'
      );
      return;
    }
    await onSaveEdit(publishImmediately);
  };

  return (
    <Modal
      isOpen={!!editingItem}
      onClose={() => setEditingItem(null)}
      title="In-Review Honor Editor"
      description="Modify achievement metadata, collaborators, proof document, and feed broadcast."
      size="xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          validateAndSubmit(false);
        }}
        className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1"
      >
        {modalError && (
          <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {modalError}
          </div>
        )}

        <div className="p-3.5 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span>Workflow State & Department Scope</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-border text-muted-foreground">
              {editingItem.status || 'PENDING'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">
                Workflow State <span className="text-rose-400">*</span>
              </label>
              <select
                value={editingItem.status || 'PENDING'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground font-medium focus:outline-none focus:border-primary"
              >
                <option value="PENDING">Submitted</option>
                <option value="UNDER_REVIEW">Under Faculty Review</option>
                <option value="APPROVED">Awaiting HOD Approval</option>
                <option value="RESUBMISSION_REQUIRED">Resubmission Required</option>
                <option value="REJECTED">Rejected</option>
                <option value="PUBLISHED">Approved & Published</option>
              </select>
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">
                Assigned Academic Department
              </label>
              <select
                value={editingItem.departmentId || ''}
                onChange={(e) => setEditingItem({ ...editingItem, departmentId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Default Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} — {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(editingItem.status === 'REJECTED' || editingItem.status === 'RESUBMISSION_REQUIRED') && (
            <div className="pt-2 border-t border-border">
              <label className="block text-rose-400 mb-1 font-medium">
                {editingItem.status === 'REJECTED' ? 'Mandatory Rejection Reason' : 'Mandatory Revision Remarks'} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Provide clear, actionable review feedback for the submitter..."
                value={editingItem.rejectionReason || ''}
                onChange={(e) => setEditingItem({ ...editingItem, rejectionReason: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-rose-500/40 rounded-xl text-foreground focus:outline-none focus:border-rose-400"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">
              Achievement Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={editingItem.title || ''}
              onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Recipient Type</label>
              <select
                value={editingItem.personType || 'STUDENT'}
                onChange={(e) => setEditingItem({ ...editingItem, personType: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
              >
                <option value="STUDENT">Student Scholar</option>
                <option value="FACULTY">Faculty Member</option>
              </select>
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Recipient Full Name</label>
              <input
                type="text"
                required
                value={editingItem.personName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, personName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              {editingItem.personType === 'FACULTY' ? (
                <>
                  <label className="block text-muted-foreground mb-1 font-medium">Faculty Designation</label>
                  <input
                    type="text"
                    value={editingItem.facultyDesignation || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, facultyDesignation: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                  />
                </>
              ) : (
                <>
                  <label className="block text-muted-foreground mb-1 font-medium">Student Roll Number</label>
                  <input
                    type="text"
                    value={editingItem.primaryStudentRoll || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, primaryStudentRoll: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Category</label>
              <CreatableSelect
                value={editingItem.categoryId || ''}
                onChange={(val) => setEditingItem({ ...editingItem, categoryId: val })}
                options={allCategories.map((c) => ({ value: c.id, label: c.name }))}
                customOptionLabel="+ Custom Category..."
                customPlaceholder="Type custom category..."
                onCreateCustom={async (name) => {
                  const created = await createCustomCategoryOption(name, 'ACHIEVEMENT');
                  if (created) {
                    setRemovedCategoryIds((prev) => {
                      const next = new Set(prev);
                      next.delete(created.value);
                      return next;
                    });
                    setExtraCategories((prev) => [...prev, { id: created.value, name: created.label }]);
                  }
                  return created;
                }}
                onRemoveOption={
                  canManageCategories
                    ? async (opt) => {
                        const ok = await removeCategoryOption(opt);
                        if (ok) {
                          setRemovedCategoryIds((prev) => new Set(prev).add(opt.value));
                          onCategoryRemoved?.(opt.value);
                        }
                        return ok;
                      }
                    : undefined
                }
              />
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Award / Position / Rank</label>
              <input
                type="text"
                value={editingItem.positionRank || ''}
                onChange={(e) => setEditingItem({ ...editingItem, positionRank: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Host Organization / Event</label>
              <input
                type="text"
                value={editingItem.organizationEventName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, organizationEventName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Competition Level</label>
              <CreatableSelect
                value={editingItem.level || 'COLLEGE'}
                onChange={(val) => setEditingItem({ ...editingItem, level: val })}
                options={[
                  { value: 'COLLEGE', label: 'College Level' },
                  { value: 'DISTRICT', label: 'District Level' },
                  { value: 'STATE', label: 'State Level' },
                  { value: 'NATIONAL', label: 'National Level' },
                  { value: 'INTERNATIONAL', label: 'International Level' },
                ]}
                customOptionLabel="+ Custom Level..."
                customPlaceholder="Type custom competition level..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Achievement Date</label>
              <input
                type="date"
                value={editingItem.achievementDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, achievementDate: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Academic Year</label>
              <CreatableSelect
                value={editingItem.academicYear || '2025-2026'}
                onChange={(val) => setEditingItem({ ...editingItem, academicYear: val })}
                options={[
                  { value: '2026-2027', label: '2026-2027' },
                  { value: '2025-2026', label: '2025-2026' },
                  { value: '2024-2025', label: '2024-2025' },
                  { value: '2023-2024', label: '2023-2024' },
                  { value: '2022-2023', label: '2022-2023' },
                  { value: '2021-2022', label: '2021-2022' },
                ]}
                customOptionLabel="+ Custom Academic Year..."
                customPlaceholder="e.g. 2027-2028"
              />
            </div>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Description / Abstract</label>
            <textarea
              rows={3}
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border space-y-3">
          <DriveFileUploader
            value={editingItem.googleDriveUrl || editingItem.certificateUrl || ''}
            onChange={(url) =>
              setEditingItem({
                ...editingItem,
                googleDriveUrl: url,
                certificateUrl: url,
              })
            }
            label="Certificate Proof Document"
            documentType="STUDENT_CERTIFICATE"
            helpText="Private verification proofs stream through /api/drive/document/[id]."
          />

          {previewUrl && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Private Certificate Stream Ready</span>
                </span>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[11px] font-medium bg-card hover:bg-secondary text-foreground rounded-lg border border-border"
                >
                  Open Document ↗
                </a>
              </div>
              <ProofPreview url={previewUrl} title={editingItem.title || 'Certificate'} heightClass="h-56" />
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Team Members & Collaborators</span>
            </h4>
            <button
              type="button"
              onClick={() =>
                setEditingItem({
                  ...editingItem,
                  participationType: editingItem.participationType === 'TEAM' ? 'INDIVIDUAL' : 'TEAM',
                })
              }
              className="px-2 py-0.5 text-[10px] font-semibold rounded-lg border border-border bg-background text-foreground"
            >
              {editingItem.participationType === 'TEAM' ? 'Team Honor' : 'Solo Honor'}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search student by roll number or name..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              onFocus={() => memberSearchResults.length > 0 && setShowMemberDropdown(true)}
              className="w-full pl-9 pr-9 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
            />
            {memberSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary animate-spin" />
            )}
            {showMemberDropdown && memberSearchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-card border border-border rounded-xl shadow-xl max-h-40 overflow-y-auto">
                {memberSearchResults.map((s) => (
                  <button
                    key={s.id || s.rollNumber}
                    type="button"
                    onClick={() => handleAddTeamMember(s)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center justify-between gap-2 border-b border-border/50 last:border-none"
                  >
                    <span className="text-xs font-semibold text-foreground truncate">
                      {s.name} ({s.rollNumber})
                    </span>
                    <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {(editingItem.teamMembers || []).map((m: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-lg bg-background border border-border"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{m.studentName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {m.rollNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTeamMember(i)}
                className="text-muted-foreground hover:text-rose-400 p-1"
                aria-label={`Remove collaborator ${m.studentName}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Broadcast to Campus Feed</span>
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!editingItem.postToFeed}
                onChange={(e) => setEditingItem({ ...editingItem, postToFeed: e.target.checked })}
                className="rounded border-border h-4 w-4"
              />
              <span className="text-xs font-semibold text-foreground">Post to Feed</span>
            </label>
          </div>
          {editingItem.postToFeed && (
            <div className="space-y-2">
              <textarea
                rows={2}
                placeholder="Feed post story..."
                value={editingItem.feedCaption || ''}
                onChange={(e) => setEditingItem({ ...editingItem, feedCaption: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground"
              />
              {editingItem.feedImageUrl ? (
                <div className="flex items-center justify-between p-2 rounded-xl border border-border bg-background">
                  <span className="text-[11px] truncate text-foreground">{editingItem.feedImageUrl}</span>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, feedImageUrl: '' })}
                    className="p-1 text-muted-foreground hover:text-rose-400"
                    aria-label="Remove celebration photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-border rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer text-xs text-primary">
                  <input type="file" accept="image/*" onChange={handleFeedImageUpload} disabled={uploadingFeedImg} className="hidden" />
                  <ImageIcon className="w-4 h-4" />
                  <span>{uploadingFeedImg ? 'Uploading photo...' : 'Attach photo for feed'}</span>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={async () => {
                const reason = (editingItem.rejectionReason || '').trim();
                if (!reason) {
                  setEditingItem({ ...editingItem, status: 'REJECTED' });
                  setModalError('Enter a non-empty rejection reason above before rejecting.');
                  return;
                }
                const ok = await onRejectAction(editingItem.id, 'REJECTED', reason);
                if (ok) setEditingItem(null);
              }}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Reject Honor
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={savingEdit}
              onClick={() => validateAndSubmit(false)}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="success"
              size="sm"
              loading={savingEdit}
              onClick={() => validateAndSubmit(true)}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Approve & Publish
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
