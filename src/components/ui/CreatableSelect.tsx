'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, List, Check, Loader2, Trash2, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface CreatableSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  customOptionLabel?: string;
  customPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /**
   * Optional async creator (e.g. for DB-backed Category IDs or Batches).
   * Receives typed label and returns created/matched option or null.
   */
  onCreateCustom?: (customLabel: string) => Promise<SelectOption | null>;
  /**
   * Optional async remover for Web Manager / Admin roles.
   * When provided, surfaces an inline "Manage / Remove" button next to the dropdown.
   */
  onRemoveOption?: (option: SelectOption) => Promise<boolean>;
}

const CUSTOM_SENTINEL = '__CUSTOM__';

/**
 * Accessible hybrid select + custom-entry + admin option-management control.
 * Keeps native <select> semantics intact while allowing custom additions and admin removals inline.
 */
export function CreatableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  customOptionLabel = '+ Custom (Type your own)...',
  customPlaceholder = 'Type custom value...',
  required = false,
  disabled = false,
  className,
  onCreateCustom,
  onRemoveOption,
}: CreatableSelectProps) {
  const valueExistsInOptions = !value || options.some((o) => o.value === value);
  const [isCustomMode, setIsCustomMode] = useState(!onCreateCustom && Boolean(value) && !valueExistsInOptions);
  const [isManageMode, setIsManageMode] = useState(false);
  const [customInput, setCustomInput] = useState(!onCreateCustom && value && !valueExistsInOptions ? value : '');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmRemoveValue, setConfirmRemoveValue] = useState<string | null>(null);
  const [removingValue, setRemovingValue] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!onCreateCustom && value && !options.some((o) => o.value === value)) {
      setCustomInput(value);
    }
  }, [value, options, onCreateCustom]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFeedbackError(null);
    const next = e.target.value;
    if (next === CUSTOM_SENTINEL) {
      setIsCustomMode(true);
      setIsManageMode(false);
      setCustomInput(onCreateCustom ? '' : value && !valueExistsInOptions ? value : '');
      return;
    }
    setIsCustomMode(false);
    onChange(next);
  };

  const commitAsyncCustom = async () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    setFeedbackError(null);
    if (!onCreateCustom) {
      onChange(trimmed);
      setIsCustomMode(false);
      return;
    }
    setIsCreating(true);
    try {
      const created = await onCreateCustom(trimmed);
      if (created) {
        onChange(created.value);
        setIsCustomMode(false);
        setCustomInput('');
      } else {
        setFeedbackError('Could not save custom option. Please check length and try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveConfirm = async (opt: SelectOption) => {
    if (!onRemoveOption) return;
    setFeedbackError(null);
    setRemovingValue(opt.value);
    try {
      const ok = await onRemoveOption(opt);
      if (ok) {
        if (value === opt.value) {
          onChange('');
        }
        setConfirmRemoveValue(null);
      } else {
        setFeedbackError(`Could not remove "${opt.label}". Admin permissions required.`);
      }
    } finally {
      setRemovingValue(null);
    }
  };

  if (isCustomMode) {
    return (
      <div className="space-y-1.5 w-full">
        <div className="flex items-center gap-1.5 w-full">
          <input
            id={id}
            name={name}
            type="text"
            value={customInput}
            disabled={disabled || isCreating}
            required={required}
            placeholder={customPlaceholder}
            autoFocus
            onChange={(e) => {
              const val = e.target.value;
              setCustomInput(val);
              if (!onCreateCustom) {
                onChange(val);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                if (onCreateCustom) {
                  e.preventDefault();
                  void commitAsyncCustom();
                }
              } else if (e.key === 'Escape') {
                setIsCustomMode(false);
              }
            }}
            onBlur={() => {
              if (onCreateCustom && customInput.trim()) {
                void commitAsyncCustom();
              }
            }}
            className={cn(
              'flex-1 min-w-0 px-3 py-2 rounded-xl border border-primary/50 bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40',
              className
            )}
          />
          {onCreateCustom && (
            <button
              type="button"
              disabled={disabled || isCreating || !customInput.trim()}
              onClick={() => void commitAsyncCustom()}
              title="Save & select custom value"
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Add</span>
            </button>
          )}
          <button
            type="button"
            disabled={disabled || isCreating}
            onClick={() => setIsCustomMode(false)}
            title="Back to dropdown options"
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground text-xs font-medium inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
        {feedbackError && (
          <p className="text-[11px] text-rose-500 font-medium" role="alert">
            {feedbackError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center gap-1.5 w-full">
        <select
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          onChange={handleSelectChange}
          className={cn(
            'flex-1 min-w-0 px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
            className
          )}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {value && !options.some((o) => o.value === value) && (
            <option value={value}>{value} (Custom)</option>
          )}
          <option value={CUSTOM_SENTINEL}>{customOptionLabel}</option>
        </select>

        {!disabled && (
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(true);
              setIsManageMode(false);
              setCustomInput(onCreateCustom ? '' : value && !valueExistsInOptions ? value : '');
            }}
            title="Type or add a custom option"
            aria-label="Add custom option"
            className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-secondary/70 hover:bg-secondary border border-border text-muted-foreground hover:text-primary transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {!disabled && onRemoveOption && options.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsManageMode((prev) => !prev);
              setConfirmRemoveValue(null);
              setFeedbackError(null);
            }}
            aria-expanded={isManageMode}
            title="Manage or remove dropdown options"
            aria-label="Manage or remove dropdown options"
            className={cn(
              'min-h-[38px] min-w-[38px] p-2 rounded-xl border transition-colors flex items-center justify-center shrink-0 cursor-pointer',
              isManageMode
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                : 'bg-secondary/70 hover:bg-secondary border-border text-muted-foreground hover:text-rose-500'
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isManageMode && onRemoveOption && (
        <div
          className="p-2.5 rounded-xl border border-border bg-card/95 shadow-sm space-y-2 animate-in fade-in"
          role="region"
          aria-label="Manage dropdown options"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Manage Options ({options.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsManageMode(false);
                  setIsCustomMode(true);
                  setCustomInput('');
                }}
                className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManageMode(false)}
                className="px-2 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-medium cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
            {options.map((opt) => {
              const isConfirming = confirmRemoveValue === opt.value;
              const isRemoving = removingValue === opt.value;

              return (
                <div
                  key={opt.value}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border transition-colors',
                    isConfirming
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-400'
                      : value === opt.value
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-background border-border text-foreground'
                  )}
                >
                  <span className="max-w-[180px] truncate">{opt.label}</span>
                  {isRemoving ? (
                    <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                  ) : isConfirming ? (
                    <span className="inline-flex items-center gap-1 ml-1">
                      <button
                        type="button"
                        onClick={() => void handleRemoveConfirm(opt)}
                        className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveValue(null)}
                        className="px-1 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] hover:text-foreground cursor-pointer"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveValue(opt.value)}
                      title={`Remove ${opt.label}`}
                      aria-label={`Remove ${opt.label}`}
                      className="p-0.5 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {feedbackError && (
        <p className="text-[11px] text-rose-500 font-medium" role="alert">
          {feedbackError}
        </p>
      )}
    </div>
  );
}
