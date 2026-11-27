import { useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { PRODUCTS, type EducationStage, type Product, formatEGP } from '../data/products';

interface SchoolsSectionProps {
  onSelectStage: (stage: EducationStage, scrollToCatalog?: boolean) => void;
  onAddToCart: (product: Product) => void;
}

const STAGE_GUIDES: {
  id: Exclude<EducationStage, 'all' | 'schools'>;
  index: string;
  title: string;
  grades: string;
  focus: string;
  startingPrice: number;
}[] = [
  {
    id: 'primary',
    index: '01.',
    title: 'معمل المرحلة الابتدائية',
    grades: 'الصفوف الرابع والخامس والسادس الابتدائي',
    focus:
      'حقائب تجارب آمنة غير قابلة للكسر لتعليم الضوء، المغناطيس، الطاقة الشمسية، حالات المادة، والقياس العملي.',
    startingPrice: 590,
  },
  {
    id: 'preparatory',
    index: '02.',
    title: 'معمل المرحلة الإعدادية',
    grades: 'الصفوف الأول والثاني والثالث الإعدادي',
    focus:
      'مساطر ضوئية وعدسات ومرايا كرية، دوائر كهربائية وأميتر وفولتميتر، جهاز هوفمان وكواشف التفاعلات الكيميائية.',
    startingPrice: 380,
  },
  {
    id: 'secondary',
    index: '03.',
    title: 'معمل المرحلة الثانوية',
    grades: 'الصفوف الأول والثاني والثالث الثانوي (علمي)',
    focus:
      'مناشير زجاجية BK7، مجاهر مركبة 1600×، زجاجيات بوروسيليكات للمعايرة، موازين رقمية 0.01 جم، وأجهزة فيزياء دقيقة.',
    startingPrice: 380,
  },
];

export function SchoolsSection({ onSelectStage, onAddToCart }: SchoolsSectionProps) {
  const [schoolName, setSchoolName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [stageScope, setStageScope] = useState<'primary' | 'preparatory' | 'secondary' | 'all'>('all');
  const [tablesCount, setTablesCount] = useState(6);
  const [quoteSubmitted, setQuoteSubmitted] = useState<string | null>(null);

  const perTableCost =
    stageScope === 'primary'
      ? 1450
      : stageScope === 'preparatory'
      ? 2450
      : stageScope === 'secondary'
      ? 3350
      : 3100;

  const rawEstimate = tablesCount * perTableCost;
  const schoolDiscount = tablesCount >= 6 ? Math.round(rawEstimate * 0.15) : 0;
  const finalEstimate = rawEstimate - schoolDiscount;

  const schoolBundleProduct = PRODUCTS.find((p) => p.id === 'school-complete-lab-package')!;

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !contactPhone.trim()) return;
    const ref = `HL-Q-${Math.floor(10000 + Math.random() * 90000)}`;
    setQuoteSubmitted(ref);
  };

  return (
    <section id="schools" className="py-20 sm:py-24 border-t border-[var(--line)] bg-[var(--bg-2)]">
      <div className="max-w-[1260px] mx-auto px-[var(--gutter)]">
        {/* Curriculum Stages Guide */}
        <div className="mb-14">
          <p className="text-[13px] text-[var(--muted)] mb-2">
            تصنيف علمي دقيق لكل صف دراسي
          </p>
          <h2 className="font-ruqaa text-[38px] sm:text-[46px] font-bold leading-[1.35] text-[var(--ink)]">
            مناهج المراحل الدراسية الثلاث
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {STAGE_GUIDES.map((st) => (
            <div
              key={st.id}
              className="p-6 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between"
            >
              <div>
                <p className="text-[12.5px] text-[var(--dim)] tabular-nums mb-3">
                  {st.index} {st.grades}
                </p>
                <h3 className="font-ruqaa text-[26px] font-bold text-[var(--ink)] mb-3">
                  {st.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-[var(--muted)] mb-6">{st.focus}</p>
              </div>
              <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
                <span className="text-[13.5px] text-[var(--muted)] tabular-nums">
                  تبدأ من <strong className="text-[var(--ink)]">{formatEGP(st.startingPrice)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectStage(st.id, true)}
                  className="text-[13.5px] font-medium text-[var(--ink)] hover:underline underline-offset-4 whitespace-nowrap"
                >
                  عرض الأدوات ←
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* School Procurement & Instant Lab Cost Estimator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 p-7 sm:p-8 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
            <div>
              <p className="text-[13px] text-[var(--muted)] mb-2">
                للمدارس الخاصة والتجريبية والسناتر التعليمية
              </p>
              <h3 className="font-ruqaa text-[34px] font-bold leading-[1.35] text-[var(--ink)] mb-4">
                تجهيز معمل العلوم المدرسي بالكامل
              </h3>
              <p className="text-[14.5px] leading-relaxed text-[var(--muted)] mb-6">
                نوفر للمدارس والمعلمين باقات تجهيز شاملة بأسعار الجملة مع فاتورة ضريبية معتمدة،
                وضمان استبدال لمدة عامين، وتوصيل مباشر حتى باب المدرسة في القاهرة الكبرى وجميع
                محافظات مصر.
              </p>

              <div className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)] text-[14px] mb-6">
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--muted)]">مدة التوريد داخل القاهرة والجيزة</span>
                  <span className="text-[var(--ink)] font-medium tabular-nums">24 – 48 ساعة</span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--muted)]">الشحن لباقي محافظات مصر</span>
                  <span className="text-[var(--ink)] font-medium tabular-nums">2 – 5 أيام عمل</span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--muted)]">خصم التجهيز لـ 6 طاولات فأكثر</span>
                  <span className="text-[var(--ink)] font-medium tabular-nums">15% خصم فوري</span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--muted)]">طرق السداد المعتمدة</span>
                  <span className="text-[var(--ink)] font-medium">تحويل بنكي · إنستا باي · كاش</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div>
                <p className="text-[12.5px] text-[var(--muted)]">باقة تجهيز معمل كامل (6 طاولات)</p>
                <p className="text-[22px] font-bold text-[var(--ink)] tabular-nums">
                  {formatEGP(schoolBundleProduct.priceEgp)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAddToCart(schoolBundleProduct)}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-[#ededed] text-[#151517] text-[14px] font-semibold hover:bg-white transition-colors whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>أضف باقة المعمل للسلة</span>
              </button>
            </div>
          </div>

          {/* Interactive School Quotation Calculator */}
          <div className="lg:col-span-6 p-7 sm:p-8 rounded-xl border border-[var(--line)] bg-[var(--bg)]">
            <h3 className="font-ruqaa text-[28px] font-bold text-[var(--ink)] mb-2">
              احسب تكلفة تجهيز معملك فوراً
            </h3>
            <p className="text-[13.5px] text-[var(--muted)] mb-6">
              اختر المرحلة وعدد الطاولات الطلابية لمعرفة التكلفة التقديرية بالجنيه المصري وطلب عرض سعر رسمي.
            </p>

            {quoteSubmitted ? (
              <div className="p-6 rounded-xl border border-emerald-500/35 bg-emerald-500/10 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-[15px]">
                  <Check className="w-5 h-5" />
                  <span>تم تسجيل طلب عرض السعر بنجاح</span>
                </div>
                <p className="text-[14px] text-[var(--ink)]">
                  رقم المرجع: <strong className="tabular-nums">{quoteSubmitted}</strong>
                </p>
                <p className="text-[13.5px] text-[var(--muted)]">
                  سيتواصل فريق توريدات المدارس في هالة مع <strong>{schoolName}</strong> على الرقم{' '}
                  <span dir="ltr" className="tabular-nums text-[var(--ink)]">
                    {contactPhone}
                  </span>{' '}
                  خلال ساعات العمل الرسمية لإرسال الفاتورة المبدئية بقيمة{' '}
                  <strong className="tabular-nums text-[var(--ink)]">
                    {formatEGP(finalEstimate)}
                  </strong>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuoteSubmitted(null);
                    setSchoolName('');
                    setContactPhone('');
                  }}
                  className="mt-2 h-9 px-4 rounded-lg border border-[var(--line-strong)] text-[13px] text-[var(--ink)] hover:bg-white/[0.06]"
                >
                  حساب عرض سعر آخر
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] text-[var(--muted)] mb-1.5">
                      المرحلة المطلوبة
                    </label>
                    <select
                      value={stageScope}
                      onChange={(e) =>
                        setStageScope(
                          e.target.value as 'primary' | 'preparatory' | 'secondary' | 'all',
                        )
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] text-[14px] focus:outline-none focus:border-white/40"
                    >
                      <option value="all">جميع المراحل (معمل شامل)</option>
                      <option value="primary">معمل ابتدائي</option>
                      <option value="preparatory">معمل إعدادي</option>
                      <option value="secondary">معمل ثانوي (فيزياء/كيمياء/أحياء)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] text-[var(--muted)] mb-1.5">
                      عدد الطاولات الطلابية ({tablesCount} طاولات)
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={14}
                      step={1}
                      value={tablesCount}
                      onChange={(e) => setTablesCount(Number(e.target.value))}
                      className="w-full h-10 accent-[#ededed]"
                    />
                  </div>
                </div>

                {/* Live Cost Readout */}
                <div className="p-4 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[12.5px] text-[var(--muted)]">التكلفة التقديرية بالمصري</p>
                    <p className="text-[22px] font-bold text-[var(--ink)] tabular-nums">
                      {formatEGP(finalEstimate)}
                    </p>
                  </div>
                  {schoolDiscount > 0 ? (
                    <span className="text-[13px] text-emerald-300 tabular-nums">
                      يشمل خصم المدارس ({formatEGP(schoolDiscount)})
                    </span>
                  ) : (
                    <span className="text-[12.5px] text-[var(--dim)]">
                      خصم 15% يفعّل تلقائياً من 6 طاولات
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] text-[var(--muted)] mb-1.5">
                      اسم المدرسة أو المعلم
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="مثال: مدرسة النيل الحديثة"
                      className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] placeholder:text-[var(--dim)] text-[14px] focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[var(--muted)] mb-1.5">
                      رقم الموبايل المصري / واتساب
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="010 1234 5678"
                      className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] placeholder:text-[var(--dim)] text-[14px] text-right focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-[#ededed] text-[#151517] text-[14px] font-semibold hover:bg-white transition-colors"
                >
                  اطلب عرض سعر وفاتورة رسمية
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
