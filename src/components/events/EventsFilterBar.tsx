'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RotateCcw, Calendar, Building2, Tag } from 'lucide-react';

interface EventsFilterBarProps {
  categories?: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  academicYears?: string[];
  types?: readonly string[];
}

export function EventsFilterBar({
  categories = [],
  departments,
  academicYears = [],
  types = ['SYMPOSIUM', 'WORKSHOP', 'HACKATHON', 'GUEST_LECTURE', 'CONFERENCE', 'TECHNICAL_FEST'],
}: EventsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || 'all';
  const currentType = searchParams.get('type') || 'all';
  const currentDepartment = searchParams.get('department') || 'all';

  const hasActiveFilters =
    Boolean(currentSearch) ||
    currentStatus !== 'all' ||
    currentType !== 'all' ||
    currentDepartment !== 'all';

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
    <div className="w-full bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors">
      {/* Top Search, Status Tabs & Reset */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
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

        {/* Status Pills */}
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
            className="self-end lg:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Select Dropdowns Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
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
              <option key={dept.id} value={dept.id} className="bg-card text-foreground">{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Event Type */}
        <div>
          <label htmlFor="type" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Tag className="w-3 h-3 text-primary" />
            <span>Event Category</span>
          </label>
          <select
            id="type"
            value={currentType}
            className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            onChange={(e) => updateFilter('type', e.target.value)}
          >
            <option value="all" className="bg-card text-foreground">All Event Categories</option>
            {types.map((type) => (
              <option key={type} value={type} className="bg-card text-foreground">{type.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
