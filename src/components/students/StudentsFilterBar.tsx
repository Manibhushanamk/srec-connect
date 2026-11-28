'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { getBatchLabel, buildMergedBatchOptions } from '@/lib/studentHelper';
import { CreatableSelect } from '@/components/ui/CreatableSelect';

interface StudentsFilterBarProps {
  departments: { id: string; name: string }[];
  batches: string[];
  sections: string[];
}

export function StudentsFilterBar({
  departments,
  batches,
  sections,
}: StudentsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentDepartment = searchParams.get('department') || 'all';
  const currentBatch = searchParams.get('batch') || 'all';
  const currentSection = searchParams.get('section') || 'all';

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentDepartment !== 'all' ||
    currentBatch !== 'all' ||
    currentSection !== 'all';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    router.push(`/students?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/students');
  };

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
      {/* Top Search & Actions Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <search className="relative flex-1">
          <label htmlFor="students-search" className="sr-only">
            Search students
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            id="students-search"
            placeholder="Search students by name, roll number, or institutional email..."
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
            className="self-end md:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Select Dropdowns Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
        {/* Department */}
        <div>
          <label htmlFor="department" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3 text-primary" />
            <span>Department</span>
          </label>
          <select
            id="department"
            value={currentDepartment}
            className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            onChange={(e) => updateFilter('department', e.target.value)}
          >
            <option value="all" className="bg-card text-foreground">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id} className="bg-card text-foreground">{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Batch */}
        <div>
          <label htmlFor="batch" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Academic Batch
          </label>
          <CreatableSelect
            id="batch"
            value={currentBatch === 'all' ? '' : currentBatch}
            onChange={(val) => updateFilter('batch', val || 'all')}
            options={buildMergedBatchOptions(batches)}
            placeholder="All Batches"
            customOptionLabel="+ Filter Custom Batch..."
            customPlaceholder="e.g. 2026-2030"
          />
        </div>

        {/* Section */}
        <div>
          <label htmlFor="section" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Section
          </label>
          <CreatableSelect
            id="section"
            value={currentSection === 'all' ? '' : currentSection}
            onChange={(val) => updateFilter('section', val || 'all')}
            options={sections.map((s) => ({ value: s, label: `Section ${s}` }))}
            placeholder="All Sections"
            customOptionLabel="+ Custom Section..."
            customPlaceholder="e.g. E"
          />
        </div>
      </div>
    </div>
  );
}
