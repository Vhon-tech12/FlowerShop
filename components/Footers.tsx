import Link from 'next/link';
import { Flower2, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <Flower2 className="h-5 w-5 text-pink-600" />
            <span className="font-bold">Flower Shop</span>
          </Link>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/"
              className="text-gray-600 transition-colors hover:text-pink-600"
            >
              Home
            </Link>
            <Link
              href="/flowers"
              className="text-gray-600 transition-colors hover:text-pink-600"
            >
              Flowers
            </Link>
            <Link
              href="/about"
              className="text-gray-600 transition-colors hover:text-pink-600"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 transition-colors hover:text-pink-600"
            >
              Contact
            </Link>
          </div>

          {/* Copyright */}
          <p className="flex items-center gap-1 text-xs text-gray-500">
            © {currentYear} Flower Shop. Made with
            <Heart className="h-3 w-3 fill-pink-500 text-pink-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}