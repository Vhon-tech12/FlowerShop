import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { ToastProvider } from '@/lib/toast-context';
import { CartDrawer } from '@/components/CartDrawer';
import { CartDrawerProvider } from '@/lib/cart-drawer-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Online Flower Shop',
  description: 'Fresh flowers for every occasion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <CartDrawerProvider>
              <CartDrawer />
              <ToastProvider>{children}</ToastProvider>
            </CartDrawerProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}