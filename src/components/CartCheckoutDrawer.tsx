import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  Building2,
  Check,
  Copy,
  CreditCard,
  Minus,
  Plus,
  Receipt,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import {
  FREE_SHIPPING_THRESHOLD,
  GOVERNORATES,
  PROMO_CODES,
  type Product,
  formatEGP,
} from '../data/products';
import { ProductVisual } from './ProductVisual';

export interface CartItem {
  product: Product;
  quantity: number;
}

type CheckoutStep = 'cart' | 'checkout' | 'confirmed';
type PaymentMethod = 'cod' | 'wallet' | 'instapay' | 'card' | 'fawry';

interface ConfirmedOrder {
  orderNumber: string;
  customerName: string;
  phone: string;
  governorateName: string;
  etaDays: string;
  address: string;
  paymentMethod: PaymentMethod;
  fawryRef?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  items: CartItem[];
}

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  icon: typeof Banknote;
}[] = [
  {
    id: 'cod',
    title: 'الدفع عند الاستلام (كاش)',
    subtitle: 'ادفع نقداً بالجنيه المصري للمندوب بعد معاينة الطلب',
    icon: Banknote,
  },
  {
    id: 'wallet',
    title: 'فودافون كاش / المحافظ الإلكترونية',
    subtitle: 'فودافون كاش · اتصالات كاش · أورنج كاش · WE Pay',
    icon: Smartphone,
  },
  {
    id: 'instapay',
    title: 'إنستا باي (InstaPay)',
    subtitle: 'تحويل لحظي مباشر عبر شبكة المدفوعات اللحظية المصرية',
    icon: Building2,
  },
  {
    id: 'card',
    title: 'البطاقة البنكية (ميزة · فيزا · ماستركارد)',
    subtitle: 'سداد فوري ببطاقات البنوك المصرية بالجنيه المصري',
    icon: CreditCard,
  },
  {
    id: 'fawry',
    title: 'فوري (Fawry Pay)',
    subtitle: 'استلم كود دفع مرجعي للسداد من أقرب ماكينة فوري خلال 48 ساعة',
    icon: Receipt,
  },
];

export function CartCheckoutDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: CartCheckoutDrawerProps) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  // Checkout customer form
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [govId, setGovId] = useState(GOVERNORATES[0].id);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [walletPhone, setWalletPhone] = useState('');
  const [instapayHandle, setInstapayHandle] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const selectedGov = useMemo(
    () => GOVERNORATES.find((g) => g.id === govId) || GOVERNORATES[0],
    [govId],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.priceEgp * item.quantity, 0),
    [items],
  );

  const discount = useMemo(() => {
    if (!appliedPromo || !PROMO_CODES[appliedPromo]) return 0;
    return Math.round((subtotal * PROMO_CODES[appliedPromo].discountPercent) / 100);
  }, [subtotal, appliedPromo]);

  const afterDiscount = Math.max(0, subtotal - discount);
  const freeShippingReached = afterDiscount >= FREE_SHIPPING_THRESHOLD;
  const shipping = items.length === 0 ? 0 : freeShippingReached ? 0 : selectedGov.shippingEgp;
  const total = afterDiscount + shipping;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - afterDiscount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code]) {
      setAppliedPromo(code);
      setPromoError('');
    } else {
      setPromoError('كود الخصم غير صحيح — جرّب HALO10 لخصم الطلاب 10%');
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanPhone = phone.replace(/\s+/g, '');
    if (customerName.trim().length < 3) {
      setFormError('يرجى كتابة الاسم الكامل بشكل صحيح.');
      return;
    }
    if (!/^01[0125]\d{8}$/.test(cleanPhone)) {
      setFormError('يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً (يبدأ بـ 010 أو 011 أو 012 أو 015).');
      return;
    }
    if (address.trim().length < 8) {
      setFormError('يرجى كتابة العنوان التفصيلي لتسهيل وصول المندوب.');
      return;
    }

    if (paymentMethod === 'wallet' && walletPhone.replace(/\s+/g, '').length < 11) {
      setFormError('يرجى إدخال رقم المحفظة الإلكترونية المحوّل منها.');
      return;
    }
    if (paymentMethod === 'instapay' && instapayHandle.trim().length < 3) {
      setFormError('يرجى إدخال اسم حساب إنستا باي أو رقم الموبايل المرتبط به.');
      return;
    }
    if (paymentMethod === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 16 || cardExpiry.trim().length < 4 || cardCvv.trim().length < 3) {
        setFormError('يرجى استكمال بيانات البطاقة البنكية (16 رقم، تاريخ الانتهاء، رمز الأمان).');
        return;
      }
    }

    const orderNum = `HL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const fawryCode =
      paymentMethod === 'fawry'
        ? `931${Math.floor(1000000 + Math.random() * 9000000)}`
        : undefined;

    setConfirmedOrder({
      orderNumber: orderNum,
      customerName: customerName.trim(),
      phone: cleanPhone,
      governorateName: selectedGov.name,
      etaDays: selectedGov.etaDays,
      address: address.trim(),
      paymentMethod,
      fawryRef: fawryCode,
      subtotal,
      discount,
      shipping,
      total,
      items: [...items],
    });
    onClearCart();
    setStep('confirmed');
  };

  const handleCopyReceipt = async () => {
    if (!confirmedOrder) return;
    const text = [
      `طلب متجر هالة لمعامل العلوم — ${confirmedOrder.orderNumber}`,
      `العميل: ${confirmedOrder.customerName} (${confirmedOrder.phone})`,
      `المحافظة: ${confirmedOrder.governorateName} — ${confirmedOrder.address}`,
      `الإجمالي: ${formatEGP(confirmedOrder.total)}`,
      confirmedOrder.fawryRef ? `كود دفع فوري: ${confirmedOrder.fawryRef}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore clipboard failures
    }
    setCopiedReceipt(true);
    window.setTimeout(() => setCopiedReceipt(false), 1500);
  };

  const handleCloseDrawer = () => {
    if (step === 'confirmed') {
      setStep('cart');
      setConfirmedOrder(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-label="سلة المشتريات وإتمام الدفع"
      onClick={handleCloseDrawer}
    >
      <div
        className="relative w-full max-w-[540px] h-full bg-[var(--bg-2)] border-r border-[var(--line-strong)] flex flex-col text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 h-[68px] shrink-0 border-b border-[var(--line)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                aria-label="العودة للسلة"
                className="w-8 h-8 grid place-items-center rounded-lg border border-[var(--line)] hover:bg-white/[0.06]"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-ruqaa text-[28px] font-bold leading-none text-[var(--ink)]">
              {step === 'cart'
                ? 'سلة المشتريات'
                : step === 'checkout'
                ? 'إتمام الطلب والدفع بالمصري'
                : 'تأكيد الطلب'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label="إغلاق السلة"
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-white/[0.06] text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Cart Items */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {items.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="font-ruqaa text-[30px] text-[var(--ink)]">سلتك فارغة حالياً</p>
                  <p className="text-[14px] text-[var(--muted)] max-w-[320px] mx-auto leading-relaxed">
                    أضف أدوات وحقائب معمل العلوم للابتدائي أو الإعدادي أو الثانوي وادفع بسهولة بالجنيه المصري.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="mt-3 h-10 px-5 rounded-lg bg-[#ededed] text-[#151517] text-[14px] font-semibold hover:bg-white transition-colors"
                  >
                    تصفح منتجات المعمل
                  </button>
                </div>
              ) : (
                <>
                  {/* Free Shipping Progress */}
                  <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] space-y-2">
                    <div className="flex items-center justify-between text-[13px]">
                      {freeShippingReached ? (
                        <span className="text-emerald-300 font-medium">
                          حصلت على شحن مجاني لجميع محافظات مصر
                        </span>
                      ) : (
                        <span className="text-[var(--muted)]">
                          أضف منتجات بقيمة{' '}
                          <strong className="text-[var(--ink)] tabular-nums">
                            {formatEGP(remainingForFreeShipping)}
                          </strong>{' '}
                          للحصول على شحن مجاني
                        </span>
                      )}
                      <span className="text-[12px] text-[var(--dim)] tabular-nums">
                        {Math.min(100, Math.round((afterDiscount / FREE_SHIPPING_THRESHOLD) * 100))}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-[#ededed] transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (afterDiscount / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Itemized List */}
                  <div className="divide-y divide-[var(--line)]">
                    {items.map(({ product, quantity }) => (
                      <div key={product.id} className="py-4 flex gap-4">
                        <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-[var(--line)]">
                          <ProductVisual product={product} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-ruqaa text-[19px] leading-snug text-[var(--ink)]">
                              {product.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(product.id)}
                              aria-label={`حذف ${product.name}`}
                              className="p-1 text-[var(--dim)] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-[12px] text-[var(--muted)] mt-0.5">
                            {product.stageLabel} · {product.departmentLabel}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="inline-flex items-center border border-[var(--line)] rounded-lg bg-[var(--bg)]">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(product.id, -1)}
                                aria-label="تقليل الكمية"
                                className="w-8 h-8 grid place-items-center text-[var(--muted)] hover:text-[var(--ink)]"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-[13px] font-semibold tabular-nums">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQty(product.id, 1)}
                                aria-label="زيادة الكمية"
                                className="w-8 h-8 grid place-items-center text-[var(--muted)] hover:text-[var(--ink)]"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-[15px] font-semibold text-[var(--ink)] tabular-nums">
                              {formatEGP(product.priceEgp * quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code */}
                  <div className="pt-2">
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="كود الخصم (مثال: HALO10)"
                        className="flex-1 h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[13.5px] text-[var(--ink)] placeholder:text-[var(--dim)] focus:outline-none focus:border-white/40"
                      />
                      <button
                        type="submit"
                        className="h-10 px-4 rounded-lg border border-[var(--line-strong)] bg-white/[0.06] text-[13.5px] font-medium hover:bg-white/[0.12] transition-colors whitespace-nowrap"
                      >
                        تطبيق
                      </button>
                    </form>
                    {promoError && <p className="text-[12.5px] text-red-400 mt-1.5">{promoError}</p>}
                    {appliedPromo && (
                      <div className="flex items-center justify-between text-[12.5px] text-emerald-300 mt-2">
                        <span>تم تفعيل {PROMO_CODES[appliedPromo].label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromo(null);
                            setPromoInput('');
                          }}
                          className="underline text-[var(--muted)] hover:text-[var(--ink)]"
                        >
                          إزالة
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-[var(--line)] bg-[var(--bg)] space-y-3">
                <div className="space-y-1.5 text-[14px]">
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>المجموع الفرعي</span>
                    <span className="tabular-nums text-[var(--ink)]">{formatEGP(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-300">
                      <span>الخصم ({appliedPromo})</span>
                      <span className="tabular-nums">- {formatEGP(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>الشحن ({selectedGov.name})</span>
                    <span className="tabular-nums text-[var(--ink)]">
                      {shipping === 0 ? 'مجاني' : formatEGP(shipping)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[var(--line)] flex justify-between text-[17px] font-bold">
                    <span>الإجمالي بالجنيه المصري</span>
                    <span className="tabular-nums">{formatEGP(total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full h-11 rounded-lg bg-[#ededed] text-[#151517] text-[14.5px] font-semibold hover:bg-white transition-colors"
                >
                  متابعة لإتمام الطلب والدفع
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Egyptian Checkout & Payment Methods */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-lg border border-red-500/40 bg-red-500/10 text-[13.5px] text-red-200">
                  {formError}
                </div>
              )}

              {/* Shipping Info */}
              <div className="space-y-4">
                <h3 className="font-ruqaa text-[22px] text-[var(--ink)]">بيانات التوصيل في مصر</h3>

                <div>
                  <label className="block text-[13px] text-[var(--muted)] mb-1.5">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="الاسم الثلاثي"
                    className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[14px] text-[var(--ink)] placeholder:text-[var(--dim)] focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[13px] text-[var(--muted)] mb-1.5">
                      رقم الموبايل المصري *
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[14px] text-[var(--ink)] text-right placeholder:text-[var(--dim)] focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] text-[var(--muted)] mb-1.5">
                      المحافظة *
                    </label>
                    <select
                      value={govId}
                      onChange={(e) => setGovId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[14px] text-[var(--ink)] focus:outline-none focus:border-white/40"
                    >
                      {GOVERNORATES.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({freeShippingReached ? 'مجاني' : formatEGP(g.shippingEgp)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] text-[var(--muted)] mb-1.5">
                    العنوان التفصيلي (الحي، الشارع، رقم العمارة والشقة) *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="مثال: مدينة نصر، شارع عباس العقاد، عمارة 14 الدور الثالث"
                    className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[14px] text-[var(--ink)] placeholder:text-[var(--dim)] focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-[13px] text-[var(--muted)] mb-1.5">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: طلب فاتورة باسم المدرسة أو الاتصال قبل الوصول"
                    className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[14px] text-[var(--ink)] placeholder:text-[var(--dim)] focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {/* Egyptian Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-ruqaa text-[22px] text-[var(--ink)]">
                  اختر طريقة الدفع بالجنيه المصري
                </h3>

                <div className="space-y-2.5">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = paymentMethod === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`rounded-xl border transition-colors ${
                          active
                            ? 'border-[#ededed] bg-white/[0.06]'
                            : 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--line-strong)]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setPaymentMethod(opt.id)}
                          className="w-full p-3.5 text-right flex items-start gap-3"
                        >
                          <div className="w-9 h-9 shrink-0 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] grid place-items-center text-[var(--ink)]">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[14px] font-semibold text-[var(--ink)]">{opt.title}</p>
                            <p className="text-[12.5px] text-[var(--muted)] mt-0.5">{opt.subtitle}</p>
                          </div>
                          <span
                            className={`w-4 h-4 mt-1 rounded-full border flex items-center justify-center shrink-0 ${
                              active ? 'border-[#ededed]' : 'border-[var(--dim)]'
                            }`}
                          >
                            {active && <span className="w-2 h-2 rounded-full bg-[#ededed]" />}
                          </span>
                        </button>

                        {/* Method-specific details */}
                        {active && opt.id === 'wallet' && (
                          <div className="px-4 pb-4 pt-1 border-t border-[var(--line)] space-y-2.5 text-[13px]">
                            <p className="text-[var(--muted)]">
                              حوّل مبلغ <strong className="text-[var(--ink)] tabular-nums">{formatEGP(total)}</strong> إلى محفظة هالة رقم{' '}
                              <strong dir="ltr" className="text-[var(--ink)] tabular-nums">
                                0109-845-2210
                              </strong>{' '}
                              ثم أدخل رقم المحفظة المحوّل منها:
                            </p>
                            <input
                              type="tel"
                              dir="ltr"
                              value={walletPhone}
                              onChange={(e) => setWalletPhone(e.target.value)}
                              placeholder="010xxxxxxxx"
                              className="w-full h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] text-right"
                            />
                          </div>
                        )}

                        {active && opt.id === 'instapay' && (
                          <div className="px-4 pb-4 pt-1 border-t border-[var(--line)] space-y-2.5 text-[13px]">
                            <p className="text-[var(--muted)]">
                              عنوان الدفع الفوري (IPA):{' '}
                              <strong dir="ltr" className="text-[var(--ink)]">
                                halo.labs@instapay
                              </strong>
                            </p>
                            <input
                              type="text"
                              value={instapayHandle}
                              onChange={(e) => setInstapayHandle(e.target.value)}
                              placeholder="اسم حسابك على إنستا باي أو رقم الموبايل"
                              className="w-full h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)]"
                            />
                          </div>
                        )}

                        {active && opt.id === 'card' && (
                          <div className="px-4 pb-4 pt-2 border-t border-[var(--line)] space-y-2.5 text-[13px]">
                            <input
                              type="text"
                              dir="ltr"
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="رقم البطاقة (ميزة / فيزا / ماستركارد)"
                              className="w-full h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] text-right tabular-nums"
                            />
                            <div className="grid grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                dir="ltr"
                                maxLength={5}
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="MM/YY"
                                className="h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] text-right tabular-nums"
                              />
                              <input
                                type="password"
                                dir="ltr"
                                maxLength={4}
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                placeholder="CVV"
                                className="h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] text-right tabular-nums"
                              />
                            </div>
                          </div>
                        )}

                        {active && opt.id === 'fawry' && (
                          <div className="px-4 pb-3.5 pt-1 border-t border-[var(--line)] text-[12.5px] text-[var(--muted)]">
                            عند تأكيد الطلب سيظهر لك كود دفع فوري مرجعي فوري صالح لمدة 48 ساعة للسداد في أي منفذ فوري بمصر.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Confirm Bar */}
            <div className="p-6 border-t border-[var(--line)] bg-[var(--bg)] space-y-3">
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-[var(--muted)]">
                  الإجمالي النهائي ({selectedGov.etaDays})
                </span>
                <span className="text-[19px] font-bold text-[var(--ink)] tabular-nums">
                  {formatEGP(total)}
                </span>
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-lg bg-[#ededed] text-[#151517] text-[14.5px] font-semibold hover:bg-white transition-colors"
              >
                تأكيد الطلب ({formatEGP(total)})
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Post-Order Confirmation Receipt */}
        {step === 'confirmed' && confirmedOrder && (
          <div className="flex-1 overflow-y-auto px-6 py-7 space-y-6">
            <div className="p-5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-[16px]">
                <Check className="w-5 h-5" />
                <span>تم تأكيد طلبك وجارٍ تجهيز الشحنة</span>
              </div>
              <p className="text-[14px] text-[var(--ink)]">
                رقم الطلب: <strong className="tabular-nums">{confirmedOrder.orderNumber}</strong>
              </p>
              <p className="text-[13px] text-[var(--muted)]">
                موعد التوصيل المتوقع إلى {confirmedOrder.governorateName}:{' '}
                <strong className="text-[var(--ink)]">{confirmedOrder.etaDays}</strong>
              </p>
            </div>

            {confirmedOrder.fawryRef && (
              <div className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--bg)] space-y-1">
                <p className="text-[13px] text-[var(--muted)]">كود الدفع المرجعي عبر فوري:</p>
                <p dir="ltr" className="text-[24px] font-bold tracking-wider text-right tabular-nums">
                  {confirmedOrder.fawryRef}
                </p>
                <p className="text-[12.5px] text-[var(--muted)]">
                  يُرجى السداد بمبلغ {formatEGP(confirmedOrder.total)} خلال 48 ساعة في أقرب ماكينة فوري.
                </p>
              </div>
            )}

            <div className="space-y-3 text-[14px]">
              <h3 className="font-ruqaa text-[22px] text-[var(--ink)]">ملخص الفاتورة</h3>
              <div className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)]">
                {confirmedOrder.items.map(({ product, quantity }) => (
                  <div key={product.id} className="py-2.5 flex justify-between gap-3">
                    <span className="text-[var(--muted)]">
                      {product.name} × <span className="tabular-nums">{quantity}</span>
                    </span>
                    <span className="tabular-nums text-[var(--ink)] shrink-0">
                      {formatEGP(product.priceEgp * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>الشحن ({confirmedOrder.governorateName})</span>
                  <span className="tabular-nums">
                    {confirmedOrder.shipping === 0 ? 'مجاني' : formatEGP(confirmedOrder.shipping)}
                  </span>
                </div>
                {confirmedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>الخصم</span>
                    <span className="tabular-nums">- {formatEGP(confirmedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[17px] font-bold pt-2 border-t border-[var(--line)]">
                  <span>الإجمالي</span>
                  <span className="tabular-nums">{formatEGP(confirmedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="text-[13.5px] text-[var(--muted)] space-y-1 p-4 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
              <p>
                <strong className="text-[var(--ink)]">المستلم:</strong> {confirmedOrder.customerName}
              </p>
              <p>
                <strong className="text-[var(--ink)]">الموبايل:</strong>{' '}
                <span dir="ltr" className="tabular-nums">
                  {confirmedOrder.phone}
                </span>
              </p>
              <p>
                <strong className="text-[var(--ink)]">العنوان:</strong> {confirmedOrder.governorateName} —{' '}
                {confirmedOrder.address}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="flex-1 h-11 rounded-lg border border-[var(--line-strong)] bg-white/[0.05] text-[14px] font-medium inline-flex items-center justify-center gap-2 hover:bg-white/[0.1] transition-colors"
              >
                {copiedReceipt ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedReceipt ? 'تم نسخ تفاصيل الطلب' : 'نسخ إيصال الطلب'}</span>
              </button>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="flex-1 h-11 rounded-lg bg-[#ededed] text-[#151517] text-[14px] font-semibold hover:bg-white transition-colors"
              >
                العودة للمتجر
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
