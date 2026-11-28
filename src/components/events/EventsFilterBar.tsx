'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, RotateCcw, Building2, Tag, Clock, Calendar } from 'lucide-react';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { FilteredExportActions } from '@/components/shared/FilteredExportActions';
import { canManageCategories } from '@/lib/admin-auth';
import { createCustomCategoryOption, removeCategoryOption } from '@/lib/client-creatable';
import { EVENT_TIMELINE_PRESETS } from '@/lib/timeline';

interface EventsFilterBarProps {
  categories?: { id: string; name: string }[];
  departments: { id: string; code?: string; name: string }[];
  academicYears?: string[];
  types?: readonly string[];
}

export function EventsFilterBar({
  categories: initialCategories = [],
  departments,
  academicYears = [],
  types = ['SYMPOSIUM', 'WORKSHOP', 'HACKATHON', 'GUEST_LECTURE', 'CONFERENCE', 'TECHNICAL_FEST'],
}: EventsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isCategoryAdmin = canManageCategories((session?.user as any)?.role);

  const [categories, setCategories] = useState(initialCategories);
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || 'all';
  const currentType = searchParams.get('type') || 'all';
  const currentCategory = searchParams.get('category') || 'all';
  const currentDepartment = searchParams.get('department') || 'all';
  const currentAcademicYear = searchParams.get('academicYear') || 'all';
  const currentTimeline = searchParams.get('timeline') || 'ALL';
  const currentDateFrom = searchParams.get('dateFrom') || '';
  const currentDateTo = searchParams.get('dateTo') || '';

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentStatus !== 'all' ||
    currentType !== 'all' ||
    currentCategory !== 'all' ||
    currentDepartment !== 'all' ||
    currentAcademicYear !== 'all' ||
    (currentTimeline !== 'ALL' && Boolean(currentTimeline)) ||
    Boolean(currentDateFrom) ||
    Boolean(currentDateTo);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all' || value === 'ALL') {
      params.delete(key);
      if (key === 'timeline') {
        params.delete('dateFrom');
        params.delete('dateTo');
      }
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    router.push(`/events?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/events');
  };

  const statusTabs = ['all', 'UPCOMING', 'ONGOING', 'COMPLETED'] as const;

  const categoryOptions =
    categories.length > 0
      ? categories.map((c) => ({ value: c.name, label: c.name }))
      : types.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }));

  const activeCategoryName =
    currentCategory !== 'all'
      ? currentCategory
      : currentType !== 'all'
      ? currentType
      : undefined;

  const matchedDeptId =
    currentDepartment !== 'all'
      ? departments.find((d) => d.id === currentDepartment || d.code === currentDepartment)?.id || currentDepartment
      : undefined;

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
      {/* Top Search, Status Tabs & Reset */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <search className="relative flex-1">
          <label htmlFor="events-search" className="sr-only">
            Search campus events
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            id="events-search"
            placeholder="Search campus events by title, venue, organizer, speaker..."
            defaultValue={currentSearch}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.nativeEvent.isComposing || (e as any).keyCode === 229) return;
                updateFilter('search', (e.target as HTMLInputElement).value);
              }
            }}
            onBlur={(e) => {
              if (e.target.value !== currentSearch) {
                updateFilter('search', e.target.value);
              }
            }}
          />
        </search>

        <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border rounded-xl overflow-x-auto" role="tablist" aria-label="Event Status">
          {statusTabs.map((status) => (
            <button
              type="button"
              role="tab"
              aria-selected={currentStatus === status}
              key={status}
              onClick={() => updateFilter('status', status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-all ${
                currentStatus === status
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {status === 'all' ? 'All Schedules' : status.toLowerCase()}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="self-end lg:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Select Dropdowns Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border">
        <div>
          <label htmlFor="department" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-primary" />
            <span>Department</span>
          </label>
          <select
            id="department"
            value={currentDepartment}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            onChange={(e) => updateFilter('department', e.target.value)}
          >
            <option value="all" className="bg-card text-foreground">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id} className="bg-card text-foreground">{dept.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="event-category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3 text-primary" />
            <span>Event Category</span>
          </label>
          <CreatableSelect
            id="event-category"
            value={currentCategory !== 'all' ? currentCategory : currentType === 'all' ? '' : currentType}
            onChange={(val) => updateFilter(categories.length > 0 ? 'category' : 'type', val || 'all')}
            options={categoryOptions}
            placeholder="All Event Categories"
            customOptionLabel={isCategoryAdmin ? '+ Add Event Category...' : '+ Custom Category Filter...'}
            customPlaceholder="Type event category..."
            onCreateCustom={
              isCategoryAdmin
                ? async (name) => {
                    const created = await createCustomCategoryOption(name, 'EVENT');
                    if (created) {
                      setCategories((prev) =>
                        prev.some((c) => c.name.toLowerCase() === created.label.toLowerCase())
                          ? prev
                          : [...prev, { id: created.value, name: created.label }]
                      );
                      router.refresh();
                      return { value: created.label, label: created.label };
                    }
                    return null;
                  }
                : undefined
            }
            onRemoveOption={
              isCategoryAdmin && categories.length > 0
                ? async (opt) => {
                    const matched = categories.find((c) => c.name === opt.value);
                    const ok = await removeCategoryOption({
                      value: matched?.id || opt.value,
                      label: opt.label,
                    });
                    if (ok) {
                      setCategories((prev) => prev.filter((c) => c.name !== opt.value));
                      if (currentCategory === opt.value) updateFilter('category', 'all');
                      router.refresh();
                    }
                    return ok;
                  }
                : undefined
            }
          />
        </div>

        <div>
          <label htmlFor="event-timeline" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary" />
            <span>Time Category / Timeline</span>
          </label>
          <select
            id="event-timeline"
            value={currentTimeline}
            onChange={(e) => updateFilter('timeline', e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {EVENT_TIMELINE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="event-ay" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-primary" />
            <span>Academic Year</span>
          </label>
          <CreatableSelect
            id="event-ay"
            value={currentAcademicYear === 'all' ? '' : currentAcademicYear}
            onChange={(val) => updateFilter('academicYear', val || 'all')}
            options={academicYears.map((ay) => ({ value: ay, label: ay }))}
            placeholder="All Academic Years"
            customOptionLabel="+ Custom Academic Year..."
            customPlaceholder="e.g. 2027-2028"
          />
        </div>
      </div>

      {/* Custom Date Range when CUSTOM timeline selected */}
      {(currentTimeline === 'CUSTOM' || currentDateFrom || currentDateTo) && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Custom Event Period:
          </span>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>From</span>
            <input
              type="date"
              value={currentDateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>To</span>
            <input
              type="date"
              value={currentDateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </div>
      )}

      {/* Export Listed Events Strip (Visible to Web Manager, HOD, Faculty, Admin, Super Admin) */}
      <FilteredExportActions
        domain="EVENTS"
        filters={{
          status: currentStatus !== 'all' ? currentStatus : undefined,
          departmentId: matchedDeptId,
          achievementCategoryId: activeCategoryName,
          academicYear: currentAcademicYear !== 'all' ? currentAcademicYear : undefined,
          timeline: currentTimeline !== 'ALL' ? currentTimeline : undefined,
          dateFrom: currentDateFrom || undefined,
          dateTo: currentDateTo || undefined,
          search: currentSearch || undefined,
        }}
        timelineLabel={EVENT_TIMELINE_PRESETS.find((t) => t.value === currentTimeline)?.label}
        className="pt-3 border-t border-border/60"
      />
    </div>
  );
}
