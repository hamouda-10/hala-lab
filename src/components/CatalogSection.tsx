import { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import {
  DEPARTMENT_FILTERS,
  PRODUCTS,
  type EducationStage,
  type Product,
  type ScienceDepartment,
  formatEGP,
} from '../data/products';
import { ProductVisual } from './ProductVisual';

interface CatalogSectionProps {
  selectedStage: EducationStage;
  onChangeStage: (stage: EducationStage) => void;
  searchQuery: string;
  onClearSearch: () => void;
  onOpenSearch: () => void;
  onAddToCart: (product: Product) => void;
  onInspectProduct: (product: Product) => void;
}

const STAGE_FILTERS: { id: EducationStage; label: string }[] = [
  { id: 'all', label: 'جميع المراحل' },
  { id: 'primary', label: 'الابتدائي' },
  { id: 'preparatory', label: 'الإعدادي' },
  { id: 'secondary', label: 'الثانوي' },
  { id: 'schools', label: 'تجهيز المدارس' },
];

type SortOption = 'featured' | 'price-asc' | 'price-desc';

export function CatalogSection({
  selectedStage,
  onChangeStage,
  searchQuery,
  onClearSearch,
  onOpenSearch,
  onAddToCart,
  onInspectProduct,
}: CatalogSectionProps) {
  const [department, setDepartment] = useState<ScienceDepartment>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const stageCounts = useMemo(() => {
    const counts: Record<EducationStage, number> = {
      all: PRODUCTS.length,
      primary: 0,
      preparatory: 0,
      secondary: 0,
      schools: 0,
    };
    PRODUCTS.forEach((p) => {
      p.stages.forEach((s) => {
        counts[s] += 1;
      });
    });
    return counts;
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = PRODUCTS.filter((p) => {
      if (selectedStage !== 'all' && !p.stages.includes(selectedStage)) return false;
      if (department !== 'all' && p.department !== department) return false;
      if (q) {
        const hay = `${p.name} ${p.shortDesc} ${p.departmentLabel} ${p.stageLabel} ${p.sku} ${p.experiments.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.priceEgp - b.priceEgp);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.priceEgp - a.priceEgp);
    }
    return [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [selectedStage, department, searchQuery, sortBy]);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAddedId(product.id);
    window.setTimeout(() => {
      setJustAddedId((curr) => (curr === product.id ? null : curr));
    }, 1100);
  };

  return (
    <section id="catalog" className="relative py-20 sm:py-24 border-t border-[var(--line)] bg-[var(--bg)]">
      <div className="max-w-[1280px] mx-auto px-[var(--gutter)]">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[13px] text-[var(--muted)] mb-2">
              {PRODUCTS.length} منتجاً معملياً معتمداً · مطابق لمناهج وزارة التربية والتعليم المصرية
            </p>
            <h2 className="font-ruqaa text-[38px] sm:text-[48px] font-bold leading-[1.35] text-[var(--ink)]">
              منتجات معمل العلوم
            </h2>
          </div>

          {/* Sort & Search Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--line-strong)] bg-white/[0.06] text-[13px] text-[var(--ink)] hover:bg-white/[0.1] transition-colors"
              >
                <span>نتائج البحث: &ldquo;{searchQuery}&rdquo;</span>
                <X className="w-3.5 h-3.5 text-[var(--muted)]" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-[var(--line)] bg-[var(--chip)] text-[13px] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>بحث سريع</span>
            </button>

            <label className="inline-flex items-center gap-2 text-[13px] text-[var(--muted)]">
              <span className="sr-only">ترتيب المنتجات</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] text-[13px] focus:outline-none focus:border-white/40"
              >
                <option value="featured">الأكثر طلباً</option>
                <option value="price-asc">السعر: من الأقل للأعلى</option>
                <option value="price-desc">السعر: من الأعلى للأقل</option>
              </select>
            </label>
          </div>
        </div>

        {/* Interactive Stage & Department Filter Controls */}
        <div className="flex flex-col gap-4 pb-8 mb-10 border-b border-[var(--line)]">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية حسب المرحلة الدراسية">
            {STAGE_FILTERS.map((st) => {
              const active = selectedStage === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onChangeStage(st.id)}
                  className={`h-10 px-4 rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap inline-flex items-center gap-2 ${
                    active
                      ? 'bg-[#ededed] text-[#151517]'
                      : 'bg-[var(--bg-2)] text-[var(--muted)] border border-[var(--line)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]'
                  }`}
                >
                  <span>{st.label}</span>
                  <span
                    className={`text-[12px] tabular-nums ${
                      active ? 'text-[#151517]/70' : 'text-[var(--dim)]'
                    }`}
                  >
                    ({stageCounts[st.id]})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
              {DEPARTMENT_FILTERS.map((dep) => {
                const active = department === dep.id;
                return (
                  <button
                    key={dep.id}
                    type="button"
                    onClick={() => setDepartment(dep.id)}
                    className={`py-1 transition-colors whitespace-nowrap border-b-2 ${
                      active
                        ? 'text-[var(--ink)] border-[#ededed] font-medium'
                        : 'text-[var(--dim)] border-transparent hover:text-[var(--muted)]'
                    }`}
                  >
                    {dep.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[13px] text-[var(--dim)] tabular-nums">
              عرض {filteredProducts.length} من أصل {PRODUCTS.length} منتجاً
            </p>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center border border-[var(--line)] rounded-xl bg-[var(--bg-2)]">
            <p className="font-ruqaa text-[28px] text-[var(--ink)] mb-2">
              لا توجد منتجات مطابقة لهذا الاختيار
            </p>
            <p className="text-[14px] text-[var(--muted)] mb-6">
              جرّب تغيير المرحلة الدراسية أو القسم العلمي لعرض جميع أدوات المعمل المتاحة.
            </p>
            <button
              type="button"
              onClick={() => {
                onChangeStage('all');
                setDepartment('all');
                onClearSearch();
              }}
              className="h-10 px-5 rounded-lg bg-[#ededed] text-[#151517] text-[14px] font-semibold hover:bg-white transition-colors"
            >
              إعادة عرض كل المنتجات ({PRODUCTS.length})
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => {
              const isAdded = justAddedId === product.id;
              return (
                <article
                  key={product.id}
                  onClick={() => onInspectProduct(product)}
                  className="group flex flex-col rounded-xl border border-[var(--line)] bg-[var(--bg-2)] overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)] cursor-pointer"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden border-b border-[var(--line)]">
                    <ProductVisual product={product} />
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-center justify-between gap-2 text-[12px] text-[var(--muted)] mb-2">
                      <span>
                        {product.stageLabel} <span aria-hidden="true">·</span> {product.departmentLabel}
                      </span>
                      {product.tag && (
                        <span className="text-[var(--ink)] font-medium">{product.tag}</span>
                      )}
                    </div>

                    <h3 className="font-ruqaa text-[23px] font-bold leading-[1.45] text-[var(--ink)] mb-2 group-hover:text-white transition-colors">
                      {product.name}
                    </h3>

                    <p className="text-[13.5px] leading-relaxed text-[var(--muted)] line-clamp-2 mb-5">
                      {product.shortDesc}
                    </p>

                    <div className="mt-auto pt-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-[17px] font-semibold text-[var(--ink)] tabular-nums">
                          {formatEGP(product.priceEgp)}
                        </span>
                        {product.oldPriceEgp && (
                          <span className="text-[12px] text-[var(--dim)] line-through tabular-nums">
                            {formatEGP(product.oldPriceEgp)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#ededed] text-[#151517] hover:bg-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>تمت الإضافة</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>أضف للسلة</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
