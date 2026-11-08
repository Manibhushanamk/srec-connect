'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Check, Users, Shield, GraduationCap, Briefcase, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface SelectedMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  rollNumber?: string | null;
  designation?: string | null;
  detail?: string;
}

interface MemberSelectorProps {
  selected: SelectedMember[];
  onChange: (members: SelectedMember[]) => void;
  placeholder?: string;
  max?: number;
  label?: string;
  excludeSelfId?: string;
}

export function MemberSelector({
  selected,
  onChange,
  placeholder = 'Search by student roll number (e.g. 22091A3201) or name...',
  max = 5,
  label,
  excludeSelfId,
}: MemberSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectedMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/members/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          let list: SelectedMember[] = data.members || [];
          if (excludeSelfId) {
            list = list.filter((m) => m.id !== excludeSelfId);
          }
          // Filter out already selected
          const selectedIds = new Set(selected.map((s) => s.id));
          list = list.filter((m) => !selectedIds.has(m.id));
          setResults(list);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Member search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selected, excludeSelfId]);

  const handleSelect = (member: SelectedMember) => {
    if (selected.length >= max) return;
    onChange([...selected, member]);
    setQuery('');
    setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    onChange(selected.filter((m) => m.id !== id));
  };

  return (
    <div className="w-full space-y-2" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            {label}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {selected.length}/{max} selected
          </span>
        </div>
      )}

      {/* Selected Member Chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/60 text-cyan-200 text-xs shadow-sm"
            >
              <span className="w-4 h-4 rounded-full bg-cyan-800 text-[10px] font-bold flex items-center justify-center text-white">
                {m.name.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium">{m.name}</span>
              {m.rollNumber && (
                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-900/60 px-1 rounded">
                  {m.rollNumber}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(m.id)}
                className="hover:text-rose-400 transition-colors ml-0.5"
                title="Remove collaborator"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      {selected.length < max && (
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              placeholder={placeholder}
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
            {loading && (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-3 pointer-events-none" />
            )}
            {query && !loading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (query.trim().length >= 2 || results.length > 0) && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl divide-y divide-slate-800/60">
              {results.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  {loading ? 'Searching members...' : `No registered members found matching "${query}"`}
                </div>
              ) : (
                results.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m)}
                    className="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 flex-shrink-0 overflow-hidden">
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          m.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                          {m.name}
                          {m.rollNumber && (
                            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950 px-1 py-0.5 rounded border border-cyan-800/50">
                              {m.rollNumber}
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {m.detail || m.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 flex-shrink-0">
                      Add <Check className="w-3 h-3" />
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
