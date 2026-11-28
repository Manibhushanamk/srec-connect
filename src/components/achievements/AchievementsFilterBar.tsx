'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Filter, RotateCcw, Award, Calendar, Clock, Building2 } from 'lucide-react';
import { CreatableSelect } from '@/components/ui/CreatableSelect';
import { FilteredExportActions } from '@/components/shared/FilteredExportActions';
import { canManageCategories } from '@/lib/admin-auth';
import { createCustomCategoryOption, removeCategoryOption } from '@/lib/client-creatable';
import { ACHIEVEMENT_TIMELINE_PRESETS } from '@/lib/timeline';

interface AchievementsFilterBarProps {
  levels: readonly string[];
  categories: { id?: string; name: string }[];
  departments: { id?: string; code: string; name: string }[];
  academicYears: string[];
}

export function AchievementsFilterBar({
  levels,
  categories: initialCategories,
  departments,
  academicYears,
}: AchievementsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isCategoryAdmin = canManageCategories((session?.user as any)?.role);

  const [categories, setCategories] = useState(initialCategories);
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const currentSearch = searchParams.get('search') || '';
  const currentLevel = searchParams.get('level') || 'all';
  const currentCategory = searchParams.get('category') || 'all';
  const currentDepartment = searchParams.get('department') || 'all';
  const currentAcademicYear = searchParams.get('academicYear') || 'all';
  const currentTimeline = searchParams.get('timeline') || 'ALL';
  const currentDateFrom = searchParams.get('dateFrom') || '';
  const currentDateTo = searchParams.get('dateTo') || '';

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentLevel !== 'all' ||
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
    router.push(`/achievements?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/achievements');
  };

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
      {/* Search and Reset */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <search className="relative flex-1">
          <label htmlFor="achievements-search" className="sr-only">
            Search verified honors
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            id="achievements-search"
            placeholder="Search verified honors by student name, roll number, organization, or title..."
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

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="self-end md:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Select Dropdowns Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-border">
        {/* Category */}
        <div>
          <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Award className="w-3 h-3 text-primary" />
            <span>Category</span>
          </label>
          <CreatableSelect
            id="category"
            value={currentCategory === 'all' ? '' : currentCategory}
            onChange={(val) => updateFilter('category', val || 'all')}
            options={categories.map((cat) => ({ value: cat.name, label: cat.name }))}
            placeholder="All Categories"
            customOptionLabel={isCategoryAdmin ? '+ Add Website Category...' : '+ Filter Custom Category...'}
            customPlaceholder="Type category name..."
            onCreateCustom={
              isCategoryAdmin
                ? async (name) => {
                    const created = await createCustomCategoryOption(name, 'ACHIEVEMENT');
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
              isCategoryAdmin
                ? async (opt) => {
                    const matched = categories.find((c) => c.name === opt.value);
                    const ok = await removeCategoryOption({
                      value: matched?.id || opt.value,
                      label: opt.label,
                    });
                    if (ok) {
                      setCategories((prev) => prev.filter((c) => c.name !== opt.value));
                      if (currentCategory === opt.value) {
                        updateFilter('category', 'all');
                      }
                      router.refresh();
                    }
                    return ok;
                  }
                : undefined
            }
          />
        </div>

        {/* Time Period / Timeline */}
        <div>
          <label htmlFor="timeline" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary" />
            <span>Timeline Period</span>
          </label>
          <select
            id="timeline"
            value={currentTimeline}
            onChange={(e) => updateFilter('timeline', e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {ACHIEVEMENT_TIMELINE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-primary" />
            <span>Department</span>
          </label>
          <select
            id="department"
            value={currentDepartment}
            onChange={(e) => updateFilter('department', e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.code} value={dept.code}>
                {dept.code} — {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div>
          <label htmlFor="level" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3 text-primary" />
            <span>Recognition Level</span>
          </label>
          <CreatableSelect
            id="level"
            value={currentLevel === 'all' ? '' : currentLevel}
            onChange={(val) => updateFilter('level', val || 'all')}
            options={levels.map((lvl) => ({ value: lvl, label: lvl }))}
            placeholder="All Levels"
            customOptionLabel="+ Filter Custom Level..."
            customPlaceholder="Type custom level..."
          />
        </div>

        {/* Academic Year */}
        <div>
          <label htmlFor="academicYear" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-primary" />
            <span>Academic Year</span>
          </label>
          <CreatableSelect
            id="academicYear"
            value={currentAcademicYear === 'all' ? '' : currentAcademicYear}
            onChange={(val) => updateFilter('academicYear', val || 'all')}
            options={academicYears.map((year) => ({ value: year, label: year }))}
            placeholder="All Academic Years"
            customOptionLabel="+ Custom Academic Year..."
            customPlaceholder="e.g. 2027-2028"
          />
        </div>
      </div>

      {/* Custom Date Window when CUSTOM timeline selected */}
      {(currentTimeline === 'CUSTOM' || currentDateFrom || currentDateTo) && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Custom Date Range:
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

      {/* Export Listed Achievements (Visible to Web Manager, HOD, Faculty, Admin, Super Admin) */}
      <FilteredExportActions
        domain="ACHIEVEMENTS"
        filters={{
          status: 'VERIFIED',
          achievementCategoryId: currentCategory !== 'all' ? currentCategory : undefined,
          level: currentLevel !== 'all' ? currentLevel : undefined,
          departmentId:
            currentDepartment !== 'all'
              ? departments.find((d) => d.code === currentDepartment)?.id
              : undefined,
          academicYear: currentAcademicYear !== 'all' ? currentAcademicYear : undefined,
          timeline: currentTimeline !== 'ALL' ? currentTimeline : undefined,
          dateFrom: currentDateFrom || undefined,
          dateTo: currentDateTo || undefined,
          search: currentSearch || undefined,
        }}
        timelineLabel={ACHIEVEMENT_TIMELINE_PRESETS.find((t) => t.value === currentTimeline)?.label}
        className="pt-3 border-t border-border/60"
      />
    </div>
  );
}
