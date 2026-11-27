import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { STAGE_TABS, type EducationStage, formatEGP } from '../data/products';
import { PrismStage } from './PrismStage';

interface HeroSectionProps {
  cartCount: number;
  cartSubtotal: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onSelectStage: (stage: EducationStage, scrollToCatalog?: boolean) => void;
}

export function HeroSection({
  cartCount,
  cartSubtotal,
  onOpenCart,
  onOpenSearch,
  onSelectStage,
}: HeroSectionProps) {
  const copyRef = useRef<HTMLDivElement | null>(null);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [displayedSummary, setDisplayedSummary] = useState(STAGE_TABS[0].summary);
  const [swapping, setSwapping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const swapTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleTabClick = (idx: number) => {
    setActiveTabIdx(idx);
    setSwapping(true);
    if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
    swapTimerRef.current = window.setTimeout(() => {
      setDisplayedSummary(STAGE_TABS[idx].summary);
      setSwapping(false);
    }, 160);
  };

  const handleCopyCode = async () => {
    const code = STAGE_TABS[activeTabIdx].code;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard fallback ignored cleanly
    }
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 1400);
  };

  const activeStage = STAGE_TABS[activeTabIdx];

  return (
    <section className="hero" aria-label="هالة لمعامل العلوم">
      <PrismStage copyRef={copyRef} />

      {/* Top Navigation Bar: Clean 3-Zone Contract */}
      <header className="relative z-20 flex items-center justify-between gap-6 px-[var(--gutter)] h-[68px]">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 whitespace-nowrap shrink-0"
          aria-label="هالة — الصفحة الرئيسية"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="#ededed"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M12 3 22 20H2z" />
          </svg>
          <span className="text-[var(--dim)] text-[20px] font-light select-none" aria-hidden="true">
            /
          </span>
          <span className="font-ruqaa text-[28px] font-bold leading-none text-[var(--ink)]">
            هالة
          </span>
        </a>

        {/* Zone 2: Concise Single-Line Nav Links */}
        <nav
          className="hidden md:flex items-center gap-7 text-[14px] text-[var(--muted)]"
          aria-label="المراحل الدراسية"
        >
          <button
            type="button"
            onClick={() => onSelectStage('primary', true)}
            className="hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            الابتدائي
          </button>
          <button
            type="button"
            onClick={() => onSelectStage('preparatory', true)}
            className="hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            الإعدادي
          </button>
          <button
            type="button"
            onClick={() => onSelectStage('secondary', true)}
            className="hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            الثانوي
          </button>
          <a
            href="#schools"
            className="hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0 py-1"
          >
            تجهيز المدارس
          </a>
        </nav>

        {/* Zone 3: Search + Cart Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden sm:flex items-center justify-between gap-5 h-9 px-3 min-w-[164px] border border-[var(--line)] rounded-lg bg-[var(--chip)] text-[13px] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
            aria-label="ابحث في منتجات المعمل"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>ابحث عن جهاز...</span>
            </span>
            <kbd
              dir="ltr"
              className="text-[11px] text-[var(--muted)] border border-[var(--line)] rounded px-1.5 py-0.5 bg-white/[0.03]"
            >
              ⌘ K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="sm:hidden w-9 h-9 grid place-items-center rounded-lg border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] hover:bg-white/[0.08] transition-colors"
            aria-label="بحث"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#ededed] text-[#151517] text-[13px] font-semibold hover:bg-white transition-colors whitespace-nowrap shrink-0"
            aria-label="فتح سلة المشتريات"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>السلة</span>
            {cartCount > 0 && (
              <span className="tabular-nums text-[12px] font-bold px-1.5 py-0.5 rounded bg-[#151517] text-[#ededed]">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="md:hidden w-9 h-9 grid place-items-center rounded-lg hover:bg-white/[0.07] text-[var(--ink)] transition-colors"
            aria-label={mobileNavOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown */}
      {mobileNavOpen && (
        <div className="md:hidden relative z-30 mx-[var(--gutter)] mt-1 p-4 rounded-xl border border-[var(--line)] bg-[#1b1b1e]">
          <div className="flex flex-col gap-2 text-[15px]">
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onSelectStage('primary', true);
              }}
              className="text-right py-2.5 px-3 rounded-lg hover:bg-white/[0.05] text-[var(--ink)]"
            >
              أدوات المرحلة الابتدائية
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onSelectStage('preparatory', true);
              }}
              className="text-right py-2.5 px-3 rounded-lg hover:bg-white/[0.05] text-[var(--ink)]"
            >
              أجهزة المرحلة الإعدادية
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onSelectStage('secondary', true);
              }}
              className="text-right py-2.5 px-3 rounded-lg hover:bg-white/[0.05] text-[var(--ink)]"
            >
              أجهزة المرحلة الثانوية
            </button>
            <a
              href="#schools"
              onClick={() => setMobileNavOpen(false)}
              className="text-right py-2.5 px-3 rounded-lg hover:bg-white/[0.05] text-[var(--ink)]"
            >
              تجهيز المعامل المدرسية
            </a>
            {cartSubtotal > 0 && (
              <div className="pt-2 mt-1 border-t border-[var(--line)] flex items-center justify-between text-[13px] text-[var(--muted)] px-3">
                <span>إجمالي السلة الحالي</span>
                <span className="tabular-nums text-[var(--ink)] font-semibold">
                  {formatEGP(cartSubtotal)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Editorial Copy (Right Side on RTL Desktop) */}
      <div ref={copyRef} className="hero-copy">
        <h1 className="wordmark rise">هالة</h1>
        <p className="lede rise rise-d1">
          <span>معمل العلوم المتكامل،</span>
          <span>للابتدائي والإعدادي والثانوي.</span>
        </p>

        {/* Stage Switcher Tabs */}
        <div
          className="flex flex-wrap items-center gap-2 text-[15px] mb-3.5 rise rise-d2"
          role="tablist"
          aria-label="المراحل الدراسية"
        >
          {STAGE_TABS.map((tab, idx) => (
            <div key={tab.id} className="flex items-center gap-2">
              {idx > 0 && (
                <span className="text-[var(--dim)] text-[11px] select-none" aria-hidden="true">
                  ·
                </span>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={activeTabIdx === idx}
                onClick={() => handleTabClick(idx)}
                className={`py-0.5 transition-colors whitespace-nowrap ${
                  activeTabIdx === idx
                    ? 'text-[var(--ink)] font-medium'
                    : 'text-[var(--dim)] hover:text-[var(--muted)]'
                }`}
              >
                {tab.shortLabel}
              </button>
            </div>
          ))}
        </div>

        {/* Hairline Bundle Preview Line with Copy Code */}
        <div className="cmd-hairline flex items-center justify-between gap-3 max-w-[490px] pt-3.5 text-[14.5px] leading-relaxed text-[var(--muted)] rise rise-d3">
          <span className={`cmd-text tabular-nums ${swapping ? 'swap' : ''}`}>
            {displayedSummary}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            title={`نسخ كود الباقة: ${activeStage.code}`}
            aria-label={`نسخ كود الباقة ${activeStage.code}`}
            className="w-8 h-8 shrink-0 grid place-items-center rounded-md text-[var(--dim)] hover:text-[var(--ink)] hover:bg-white/[0.06] transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Primary CTA Row */}
        <div className="flex flex-wrap items-center gap-4 mt-7 rise rise-d4">
          <button
            type="button"
            onClick={() => onSelectStage(activeStage.id, true)}
            className="h-11 px-6 rounded-lg bg-[#ededed] text-[#151517] text-[14px] font-semibold hover:bg-white transition-colors whitespace-nowrap"
          >
            تصفح منتجات {activeStage.shortLabel}
          </button>
          <a
            href="#catalog"
            onClick={(e) => {
              e.preventDefault();
              onSelectStage('all', true);
            }}
            className="h-11 px-5 rounded-lg border border-[var(--line)] bg-[var(--chip)] text-[var(--ink)] text-[14px] font-medium hover:border-[var(--line-strong)] hover:bg-white/[0.08] transition-colors inline-flex items-center whitespace-nowrap"
          >
            عرض المتجر بالكامل
          </a>
        </div>

        {/* Quiet inline trust note (unboxed metadata) */}
        <p className="mt-6 text-[13px] text-[var(--dim)] flex flex-wrap items-center gap-x-2.5 gap-y-1 rise rise-d4">
          <span>الدفع بالجنيه المصري</span>
          <span aria-hidden="true">·</span>
          <span>فودافون كاش وإنستا باي والدفع عند الاستلام</span>
          <span aria-hidden="true">·</span>
          <span>شحن لجميع المحافظات</span>
        </p>
      </div>
    </section>
  );
}
