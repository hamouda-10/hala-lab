import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PRODUCTS, type Product, formatEGP } from '../data/products';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onApplySearchQuery: (query: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  onSelectProduct,
  onApplySearchQuery,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCTS.slice(0, 6);
    return PRODUCTS.filter((p) =>
      `${p.name} ${p.shortDesc} ${p.stageLabel} ${p.departmentLabel} ${p.experiments.join(' ')}`
        .toLowerCase()
        .includes(q),
    ).slice(0, 8);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-label="البحث في منتجات المعمل"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] rounded-2xl border border-[var(--line-strong)] bg-[var(--bg-2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApplySearchQuery(query);
            onClose();
          }}
          className="flex items-center gap-3 px-4 h-14 border-b border-[var(--line)]"
        >
          <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن: منشور زجاجي، مجهر، حقيبة ابتدائي، هوفمان، أميتر..."
            className="flex-1 bg-transparent text-[15px] text-[var(--ink)] placeholder:text-[var(--dim)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق البحث"
            className="w-8 h-8 grid place-items-center rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        <div className="max-h-[55vh] overflow-y-auto divide-y divide-[var(--line)]">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-[var(--muted)]">
              لا توجد نتائج مطابقة لـ &ldquo;{query}&rdquo;
            </div>
          ) : (
            matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelectProduct(p);
                  onClose();
                }}
                className="w-full px-5 py-3.5 text-right flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-ruqaa text-[20px] text-[var(--ink)] truncate">{p.name}</p>
                  <p className="text-[12.5px] text-[var(--muted)] mt-0.5">
                    {p.stageLabel} · {p.departmentLabel}
                  </p>
                </div>
                <span className="text-[14px] font-semibold text-[var(--ink)] tabular-nums shrink-0">
                  {formatEGP(p.priceEgp)}
                </span>
              </button>
            ))
          )}
        </div>

        {query.trim() && matches.length > 0 && (
          <div className="px-5 py-3 border-t border-[var(--line)] bg-[var(--bg)] flex justify-between items-center text-[13px]">
            <span className="text-[var(--muted)]">اضغط Enter لتصفية المتجر بالكامل</span>
            <button
              type="button"
              onClick={() => {
                onApplySearchQuery(query);
                onClose();
              }}
              className="text-[var(--ink)] font-medium hover:underline"
            >
              عرض كل النتائج ←
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
