'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { Flower } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

interface FlowerCardProps {
  flower: Flower;
}

export function FlowerCard({ flower }: FlowerCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(flower);   // ✅ I-pasa ang buong flower

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg">
      <Link href={`/flowers/${flower.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={flower.imageUrl}
            alt={flower.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur">
            {flower.category}
          </span>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/flowers/${flower.id}`}>
          <h3 className="mb-1 line-clamp-1 text-lg font-semibold transition-colors hover:text-pink-600">
            {flower.name}
          </h3>
        </Link>
        <p className="mb-3 line-clamp-2 text-sm text-gray-500">
          {flower.description}
        </p>
        <p className="text-xl font-bold text-pink-600">
          ₱{flower.price.toLocaleString()}
        </p>
      </div>

      <div className="p-4 pt-0">
        <button
          onClick={handleAddToCart}
          disabled={flower.stock === 0}
          className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 ${
            added
              ? 'bg-green-600 text-white'
              : 'bg-pink-600 text-white hover:bg-pink-700'
          }`}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}