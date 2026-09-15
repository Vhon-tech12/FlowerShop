'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Flower } from '@/lib/types';

export interface CartItem {
  flowerId: string;
  flowerName: string;
  price: number;
  imageUrl: string;
  stock: number;
  quantity: number;
}

export interface AppliedPromo {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (flower: Flower, quantity?: number) => void;
  updateQuantity: (flowerId: string, quantity: number) => void;
  removeFromCart: (flowerId: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  appliedPromo: AppliedPromo | null;
  applyPromo: (promo: AppliedPromo) => void;
  removePromo: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'flowery_cart';
const PROMO_STORAGE_KEY = 'flowery_promo';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      const savedPromo = localStorage.getItem(PROMO_STORAGE_KEY);
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedPromo) setAppliedPromo(JSON.parse(savedPromo));
    } catch (err) {
      console.error('Failed to load cart from storage:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (appliedPromo) {
        localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(appliedPromo));
      } else {
        localStorage.removeItem(PROMO_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to save promo:', err);
    }
  }, [appliedPromo, isHydrated]);

  const addToCart = (flower: Flower, quantity = 1) => {
    if (!flower?.id) {
      console.warn('addToCart: flower has no id', flower);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.flowerId === flower.id
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          quantity: Math.min(
            existing.quantity + quantity,
            flower.stock ?? Infinity
          ),
        };
        return updated;
      }

      return [
        ...prev,
        {
          flowerId: flower.id,
          flowerName: flower.name,
          price: flower.price,
          imageUrl: flower.imageUrl,
          stock: flower.stock ?? 0,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (flowerId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(flowerId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.flowerId === flowerId
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    );
  };

  const removeFromCart = (flowerId: string) => {
    setCart((prev) => prev.filter((item) => item.flowerId !== flowerId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
  };

  const applyPromo = (promo: AppliedPromo) => {
    setAppliedPromo(promo);
  };

  const removePromo = () => {
    setAppliedPromo(null);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        totalItems,
        appliedPromo,
        applyPromo,
        removePromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}