import type { EducationStage } from '../data/products';

interface FooterProps {
  onSelectStage: (stage: EducationStage, scrollToCatalog?: boolean) => void;
}

export function Footer({ onSelectStage }: FooterProps) {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--bg)] py-14 text-[13.5px] text-[var(--muted)]">
      <div className="max-w-[1260px] mx-auto px-[var(--gutter)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-[var(--line)]">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ededed" aria-hidden="true">
                <path d="M12 3 22 20H2z" />
              </svg>
              <span className="font-ruqaa text-[30px] font-bold text-[var(--ink)] leading-none">
                هالة لمعامل العلوم
              </span>
            </div>
            <p className="leading-relaxed max-w-[380px]">
              متجر مصري متخصص في توفير أدوات وأجهزة وحقائب معامل العلوم للمراحل الابتدائية
              والإعدادية والثانوية وتجهيز المدارس بأعلى معايير الدقة والأمان.
            </p>
          </div>

          {/* Stages Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-ruqaa text-[20px] text-[var(--ink)]">المراحل الدراسية</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectStage('primary', true)}
                  className="hover:text-[var(--ink)] transition-colors"
                >
                  أدوات المرحلة الابتدائية
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectStage('preparatory', true)}
                  className="hover:text-[var(--ink)] transition-colors"
                >
                  أجهزة المرحلة الإعدادية
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectStage('secondary', true)}
                  className="hover:text-[var(--ink)] transition-colors"
                >
                  أجهزة المرحلة الثانوية
                </button>
              </li>
              <li>
                <a href="#schools" className="hover:text-[var(--ink)] transition-colors">
                  تجهيز معامل المدارس
                </a>
              </li>
            </ul>
          </div>

          {/* Payments & Support */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-ruqaa text-[20px] text-[var(--ink)]">
              الدفع بالمصري وخدمة العملاء
            </h4>
            <p className="leading-relaxed">
              الدفع عند الاستلام · فودافون كاش والمحافظ الإلكترونية · إنستا باي · ميزة وفيزا
              وماستركارد · فوري
            </p>
            <p className="text-[var(--dim)]">
              القاهرة — المعرض الرئيسي ومستودع التوريدات · يومياً من 9 صباحاً حتى 9 مساءً
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] text-[var(--dim)]">
          <p>© {new Date().getFullYear()} هالة لمعامل العلوم — جميع الحقوق محفوظة.</p>
          <p>الأسعار شاملة ضريبة القيمة المضافة بالجنيه المصري (ج.م)</p>
        </div>
      </div>
    </footer>
  );
}
