'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
    <Card variant="glass">
      <CardContent className="p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters
          </h3>
          {(currentSearch || currentDepartment !== 'all' || currentBatch !== 'all' || currentSection !== 'all') && (
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
              placeholder="Search by name, roll number..."
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
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Batch */}
        <div>
          <label htmlFor="batch" className="label-text">Batch</label>
          <select
            id="batch"
            value={currentBatch}
            className="input-field"
            onChange={(e) => updateFilter('batch', e.target.value)}
          >
            <option value="all">All Batches</option>
            {batches.map((batch) => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div>
          <label htmlFor="section" className="label-text">Section</label>
          <select
            id="section"
            value={currentSection}
            className="input-field"
            onChange={(e) => updateFilter('section', e.target.value)}
          >
            <option value="all">All Sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>{section}</option>
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
