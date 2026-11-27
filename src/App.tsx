import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartCheckoutDrawer, type CartItem } from './components/CartCheckoutDrawer';
import { CatalogSection } from './components/CatalogSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { ProductModal } from './components/ProductModal';
import { SchoolsSection } from './components/SchoolsSection';
import { SearchModal } from './components/SearchModal';
import { PRODUCTS, type EducationStage, type Product, formatEGP } from './data/products';

const CART_STORAGE_KEY = 'halo_science_cart_v1';

function loadInitialCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { id: string; quantity: number }[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        const product = PRODUCTS.find((p) => p.id === entry.id);
        if (!product || !entry.quantity || entry.quantity < 1) return null;
        return { product, quantity: Math.min(50, Math.floor(entry.quantity)) };
      })
      .filter((x): x is CartItem => x !== null);
  } catch {
    return [];
  }
}

export default function App() {
  const [selectedStage, setSelectedStage] = useState<EducationStage>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>(loadInitialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const compact = cartItems.map((c) => ({ id: c.product.id, quantity: c.quantity }));
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // Storage unavailable
    }
  }, [cartItems]);

  // Global Cmd/Ctrl + K search shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const handleAddToCart = useCallback(
    (product: Product, quantity = 1) => {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: Math.min(50, item.quantity + quantity) }
              : item,
          );
        }
        return [...prev, { product, quantity }];
      });
      showToast(`تمت إضافة «${product.name}» إلى السلة (${formatEGP(product.priceEgp * quantity)})`);
    },
    [showToast],
  );

  const handleUpdateQty = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const handleSelectStage = useCallback((stage: EducationStage, scrollToCatalog = false) => {
    setSelectedStage(stage);
    if (scrollToCatalog) {
      const el = document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleApplySearchQuery = useCallback((q: string) => {
    setSearchQuery(q);
    setSelectedStage('all');
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.priceEgp * item.quantity, 0),
    [cartItems],
  );

  return (
    <div id="top" className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <HeroSection
        cartCount={cartCount}
        cartSubtotal={cartSubtotal}
        onOpenCart={() => setCartOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onSelectStage={handleSelectStage}
      />

      <main>
        <CatalogSection
          selectedStage={selectedStage}
          onChangeStage={setSelectedStage}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          onOpenSearch={() => setSearchOpen(true)}
          onAddToCart={(product) => handleAddToCart(product, 1)}
          onInspectProduct={setActiveProduct}
        />

        <SchoolsSection
          onSelectStage={handleSelectStage}
          onAddToCart={(product) => handleAddToCart(product, 1)}
        />
      </main>

      <Footer onSelectStage={handleSelectStage} />

      <ProductModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartCheckoutDrawer
        isOpen={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={setActiveProduct}
        onApplySearchQuery={handleApplySearchQuery}
      />

      {/* Non-intrusive cart feedback toast */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-[420px] z-40 px-4 py-3 rounded-xl border border-[var(--line-strong)] bg-[#1f1f24] text-[13.5px] text-[var(--ink)] shadow-2xl flex items-center justify-between gap-4"
        >
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => {
              setToastMsg(null);
              setCartOpen(true);
            }}
            className="text-[13px] font-semibold underline underline-offset-4 shrink-0 text-white"
          >
            عرض السلة
          </button>
        </div>
      )}
    </div>
  );
}
