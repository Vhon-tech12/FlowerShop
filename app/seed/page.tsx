'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const seedFlowers = [
  {
    name: 'Red Roses Bouquet',
    description: 'A classic bouquet of 12 fresh red roses, perfect for romantic occasions.',
    price: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1548586196-aa5803b77379?w=800',
    stock: 20,
    category: 'Roses',
  },
  {
    name: 'Sunflower Arrangement',
    description: "Bright and cheerful sunflowers to light up anyone's day.",
    price: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800',
    stock: 15,
    category: 'Sunflowers',
  },
  {
    name: 'White Lilies',
    description: 'Elegant white lilies perfect for weddings and special events.',
    price: 1800,
    imageUrl: 'https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=800',
    stock: 10,
    category: 'Lilies',
  },
  {
    name: 'Mixed Tulips',
    description: 'Colorful mix of fresh tulips in assorted colors.',
    price: 1350,
    imageUrl: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800',
    stock: 25,
    category: 'Tulips',
  },
  {
    name: 'Pink Peonies',
    description: 'Soft pink peonies arranged beautifully for any occasion.',
    price: 2000,
    imageUrl: 'https://images.unsplash.com/photo-1591886960571-74d43a9d4166?w=800',
    stock: 8,
    category: 'Peonies',
  },
  {
    name: 'Orchid Arrangement',
    description: 'Exotic purple orchids in an elegant vase.',
    price: 2500,
    imageUrl: 'https://images.unsplash.com/photo-1567748157439-651aca2ff064?w=800',
    stock: 12,
    category: 'Orchids',
  },
];

export default function SeedPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setStatus('Nagse-seed ng data...');
    try {
      for (const flower of seedFlowers) {
        await addDoc(collection(db, 'flowers'), flower);
      }
      setStatus(`✅ Success! Na-add ang ${seedFlowers.length} flowers sa Firestore.`);
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Seed Database</h1>
        <p className="mb-6 text-sm text-gray-600">
          I-click ang button para mag-add ng 6 flowers sa Firestore.
          <br />
          <strong>Gawin mo lang ito isang beses.</strong>
        </p>

        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full rounded-md bg-pink-600 px-6 py-3 font-medium text-white hover:bg-pink-700 disabled:bg-gray-400"
        >
          {loading ? 'Nagse-seed...' : 'Seed Flowers'}
        </button>

        {status && (
          <p className="mt-4 rounded-md bg-gray-50 p-3 text-sm">{status}</p>
        )}
      </div>
    </div>
  );
}