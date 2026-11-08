'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface EventsFilterBarProps {
  categories: { name: string }[];
  departments: { code: string; name: string }[];
  academicYears: string[];
}

export function EventsFilterBar({
  categories,
  departments,
  academicYears,
}: EventsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || 'all';
  const currentCategory = searchParams.get('category') || 'all';
  const currentDepartment = searchParams.get('department') || 'all';
  const currentAcademicYear = searchParams.get('academicYear') || 'all';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      params.delete(key);
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

  return (
    <Card variant="glass">
      <CardContent className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters
          </h3>
          {(currentSearch || currentStatus !== 'all' || currentCategory !== 'all' || currentDepartment !== 'all' || currentAcademicYear !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Search */}
        <div>
          <label htmlFor="search" className="label-text">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              id="search"
              placeholder="Search events..."
              defaultValue={currentSearch}
              className="input-field pl-10"
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
        </div>

        {/* Status */}
        <div>
          <label className="label-text">Status</label>
          <div className="flex gap-2 flex-wrap" role="tablist">
            {statusTabs.map((status) => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={currentStatus === status}
                onClick={() => updateFilter('status', status)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentStatus === status
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="label-text">Category</label>
          <select
            id="category"
            value={currentCategory}
            className="input-field"
            onChange={(e) => updateFilter('category', e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="label-text">Department</label>
          <select
            id="department"
            value={currentDepartment}
            className="input-field"
            onChange={(e) => updateFilter('department', e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.code} value={dept.code}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Academic Year */}
        <div>
          <label htmlFor="academicYear" className="label-text">Academic Year</label>
          <select
            id="academicYear"
            value={currentAcademicYear}
            className="input-field"
            onChange={(e) => updateFilter('academicYear', e.target.value)}
          >
            <option value="all">All Years</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <Button variant="secondary" fullWidth onClick={clearFilters}>
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  );
}
