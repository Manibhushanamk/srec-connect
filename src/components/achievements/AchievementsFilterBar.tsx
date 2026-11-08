'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RotateCcw, Award, Calendar, Building2 } from 'lucide-react';

interface AchievementsFilterBarProps {
  levels: readonly string[];
  categories: { name: string }[];
  departments: { code: string; name: string }[];
  academicYears: string[];
}

export function AchievementsFilterBar({
  levels,
  categories,
  departments,
  academicYears,
}: AchievementsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentLevel = searchParams.get('level') || 'all';
  const currentCategory = searchParams.get('category') || 'all';
  const currentDepartment = searchParams.get('department') || 'all';
  const currentAcademicYear = searchParams.get('academicYear') || 'all';

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentLevel !== 'all' ||
    currentCategory !== 'all' ||
    currentDepartment !== 'all' ||
    currentAcademicYear !== 'all';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      params.delete(key);
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
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            id="search"
            placeholder="Search verified honors by student name, roll number, organization, or title..."
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border">
        {/* Department */}
        <div>
          <label htmlFor="department" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-primary" />
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
              <option key={dept.code} value={dept.code} className="bg-card text-foreground">{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Award className="w-3 h-3 text-primary" />
            <span>Category</span>
          </label>
          <select
            id="category"
            value={currentCategory}
            className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            onChange={(e) => updateFilter('category', e.target.value)}
          >
            <option value="all" className="bg-card text-foreground">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name} className="bg-card text-foreground">{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div>
          <label htmlFor="level" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3 text-primary" />
            <span>Recognition Level</span>
          </label>
          <select
            id="level"
            value={currentLevel}
            className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            onChange={(e) => updateFilter('level', e.target.value)}
          >
            <option value="all" className="bg-card text-foreground">All Levels</option>
            {levels.map((lvl) => (
              <option key={lvl} value={lvl} className="bg-card text-foreground">{lvl}</option>
            ))}
          </select>
        </div>

        {/* Academic Year */}
        <div>
          <label htmlFor="academicYear" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-primary" />
            <span>Academic Year</span>
          </label>
          <select
            id="academicYear"
            value={currentAcademicYear}
            className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            onChange={(e) => updateFilter('academicYear', e.target.value)}
          >
            <option value="all" className="bg-card text-foreground">All Academic Years</option>
            {academicYears.map((year) => (
              <option key={year} value={year} className="bg-card text-foreground">{year}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
