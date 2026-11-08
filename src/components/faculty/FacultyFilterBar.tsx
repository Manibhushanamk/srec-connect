'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RotateCcw, Briefcase } from 'lucide-react';

const DEFAULT_ROLE_CATEGORIES = [
  { value: 'HOD', label: 'Head of Department' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor' },
  { value: 'ASSISTANT_PROFESSOR', label: 'Assistant Professor' },
];

interface FacultyFilterBarProps {
  departments: { id: string; name: string }[];
  roleCategories?: string[];
  categories?: { value: string; label: string }[];
}

export function FacultyFilterBar({
  departments,
  roleCategories,
  categories,
}: FacultyFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentDepartment = searchParams.get('department') || 'all';
  const currentRole = searchParams.get('roleCategory') || 'all';

  const categoryList = categories || DEFAULT_ROLE_CATEGORIES;

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentDepartment !== 'all' ||
    currentRole !== 'all';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    router.push(`/faculty?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/faculty');
  };

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
      {/* Search and Reset */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            id="search"
            placeholder="Search faculty by name, designation, research interest, or specialization..."
            defaultValue={currentSearch}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilter('search', (e.target as HTMLInputElement).value);
              }
            }}
            onBlur={(e) => {
              if (e.target.value !== currentSearch) {
                updateFilter('search', e.target.value);
              }
            }}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="self-end md:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Select Dropdowns Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
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

        {/* Role Category */}
        <div>
          <label htmlFor="roleCategory" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-primary" />
            <span>Role / Rank Category</span>
          </label>
          <select
            id="roleCategory"
            value={currentRole}
            className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            onChange={(e) => updateFilter('roleCategory', e.target.value)}
          >
            <option value="all" className="bg-card text-foreground">All Role Categories</option>
            {categoryList.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-card text-foreground">{cat.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
