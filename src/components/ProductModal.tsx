import { useEffect, useState } from 'react';
import { Check, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { type Product, formatEGP } from '../data/products';
import { ProductVisual } from './ProductVisual';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setQty(1);
    setAdded(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[960px] max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--line-strong)] bg-[var(--bg-2)] text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق نافذة المنتج"
          className="absolute top-4 left-4 z-10 w-10 h-10 grid place-items-center rounded-lg border border-[var(--line)] bg-[#151517]/90 text-[var(--ink)] hover:bg-[#151517] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Image & Contents Column */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-l border-[var(--line)] flex flex-col">
            <div className="aspect-[4/3] w-full overflow-hidden">
              <ProductVisual product={product} />
            </div>

            <div className="p-6 space-y-4">
              <h4 className="font-ruqaa text-[22px] text-[var(--ink)]">محتويات العبوة</h4>
              <ul className="space-y-2 text-[13.5px] text-[var(--muted)]">
                {product.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-[var(--ink)] mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contiguous Purchase Module & Specs */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col gap-6">
            <div>
              <p className="text-[13px] text-[var(--muted)] mb-2">
                {product.stageLabel} <span aria-hidden="true">·</span> {product.departmentLabel}{' '}
                <span aria-hidden="true">·</span> كود {product.sku}
              </p>
              <h2
                id="pdp-title"
                className="font-ruqaa text-[32px] sm:text-[36px] font-bold leading-[1.35] text-[var(--ink)] mb-3"
              >
                {product.name}
              </h2>
              <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">
                {product.description}
              </p>
            </div>

            {/* Price & Quantity Purchase Bar */}
            <div className="p-5 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[24px] font-bold text-[var(--ink)] tabular-nums">
                    {formatEGP(product.priceEgp * qty)}
                  </span>
                  {product.oldPriceEgp && (
                    <span className="text-[14px] text-[var(--dim)] line-through tabular-nums">
                      {formatEGP(product.oldPriceEgp * qty)}
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] text-[var(--muted)] mt-1">
                  شامل الضريبة · متوفر للشحن الفوري داخل مصر
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-[var(--line)] rounded-lg bg-[var(--bg-2)]">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="تقليل الكمية"
                    className="w-10 h-10 grid place-items-center text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-9 text-center text-[14px] font-semibold tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(30, q + 1))}
                    aria-label="زيادة الكمية"
                    className="w-10 h-10 grid place-items-center text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-[14px] font-semibold transition-colors whitespace-nowrap ${
                    added
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#ededed] text-[#151517] hover:bg-white'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>أضيف للسلة</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>أضف إلى السلة</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Curriculum Experiments */}
            <div>
              <h3 className="font-ruqaa text-[22px] text-[var(--ink)] mb-3">
                التجارب المنهجية المغطاة
              </h3>
              <ul className="space-y-2 text-[14px] text-[var(--muted)]">
                {product.experiments.map((exp, idx) => (
                  <li key={exp} className="flex items-start gap-2.5">
                    <span className="text-[12px] text-[var(--dim)] tabular-nums mt-0.5">
                      0{idx + 1}.
                    </span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Specs */}
            <div>
              <h3 className="font-ruqaa text-[22px] text-[var(--ink)] mb-3">المواصفات الفنية</h3>
              <div className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)]">
                {product.specs.map((sp) => (
                  <div
                    key={sp.label}
                    className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[13.5px]"
                  >
                    <span className="text-[var(--muted)]">{sp.label}</span>
                    <span className="text-[var(--ink)] font-medium">{sp.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
