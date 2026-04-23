"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, CheckCircle2, Loader2, Building2 } from "lucide-react";

export interface Company {
  name: string;
  orgNumber: string;
  displayLabel: string;
  industry?: string;
  municipality?: string;
}

interface CompanySearchProps {
  onSelect: (company: Company | null) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function CompanySearch({ onSelect }: CompanySearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Company | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(inputValue, 300);

  useEffect(() => {
    if (selected || debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/brreg?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setResults([]);
        } else {
          setResults(data);
          setActiveIndex(-1);
        }
        setIsOpen(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Klarte ikke å hente data. Prøv igjen.");
          setResults([]);
          setIsOpen(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, selected]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  function handleSelect(company: Company) {
    setSelected(company);
    setInputValue(company.name);
    setIsOpen(false);
    setResults([]);
    setActiveIndex(-1);
    onSelect(company);
  }

  function handleClear() {
    setSelected(null);
    setInputValue("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setError(null);
    onSelect(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && results.length > 0) { setIsOpen(true); return; }
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const showDropdown = isOpen && !selected;
  const showEmpty =
    showDropdown && !isLoading && results.length === 0 && !error && debouncedQuery.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div
        className={`flex items-center border rounded-lg bg-white transition-all duration-200 ${
          selected
            ? "border-green-500 ring-2 ring-green-500/20"
            : "border-slate-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20"
        }`}
      >
        <div className="pl-3 flex-shrink-0">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
          ) : selected ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Search className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { if (!selected) setInputValue(e.target.value); }}
          onFocus={() => { if (!selected && results.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Søk på bedriftsnavn eller org.nr..."
          readOnly={!!selected}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          className={`flex-1 px-3 py-2.5 text-sm bg-transparent outline-none ${
            selected
              ? "text-slate-900 font-medium cursor-default"
              : "text-slate-800 placeholder:text-slate-400"
          }`}
        />

        {(inputValue || selected) && (
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            aria-label="Fjern valgt bedrift"
            className="pr-3 pl-1 flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Company meta shown after selection */}
      {selected && (
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
          <p className="text-xs text-slate-500">
            Org.nr: <span className="font-medium text-slate-700">{selected.orgNumber}</span>
          </p>
          {selected.municipality && (
            <p className="text-xs text-slate-500">
              Adresse: <span className="font-medium text-slate-700">{selected.municipality}</span>
            </p>
          )}
          {selected.industry && (
            <p className="text-xs text-slate-500">
              Bransje: <span className="font-medium text-slate-700">{selected.industry}</span>
            </p>
          )}
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (results.length > 0 || showEmpty || error) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {error ? (
            <p className="px-4 py-3 text-sm text-red-600">{error}</p>
          ) : showEmpty ? (
            <p className="px-4 py-3 text-sm text-slate-500">
              Ingen bedrifter funnet for &ldquo;{debouncedQuery}&rdquo;
            </p>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-64 overflow-y-auto divide-y divide-slate-100"
            >
              {results.map((company, i) => (
                <li
                  key={company.orgNumber}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(company); }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    i === activeIndex ? "bg-green-50" : "hover:bg-slate-50"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{company.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0">
                      <p className="text-xs text-slate-500">{company.orgNumber}</p>
                      {company.municipality && (
                        <p className="text-xs text-slate-400">{company.municipality}</p>
                      )}
                      {company.industry && (
                        <p className="text-xs text-slate-400 truncate">{company.industry}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
