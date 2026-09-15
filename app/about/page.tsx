import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Flower2 } from 'lucide-react';

const flowerShowcase = [
  {
    name: 'Romantic Roses',
    role: 'Signature Collection',
    image: 'https://images.unsplash.com/photo-1548586196-aa5803b77379?w=600&q=80',
  },
  {
    name: 'Spring Tulips',
    role: 'Seasonal Special',
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600&q=80',
  },
  {
    name: 'Elegant Lilies',
    role: 'Premium Arrangement',
    image: 'https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=600&q=80',
  },
];

const footerLinks = {
  customerService: [
    { label: 'Help & Contact Us', href: '/contact' },
    { label: 'Return Refunds', href: '/refunds' },
    { label: 'Online Store', href: '/flowers' },
    { label: 'Terms & Condition', href: '/terms' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Order Tracking', href: '/tracking' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Login', href: '/login' },
  ],
  socialMedia: [
    { label: 'Twitter', href: '#' },
    { label: 'Instagram', href: '#' },
    { label: 'Facebook', href: '#' },
    { label: 'Pinterest', href: '#' },
  ],
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] font-sans text-gray-800">
      <Navbar />

      <main className="flex-1">
        {/* PAGE HEADER */}
        <section className="relative flex flex-col items-center justify-center py-16 md:py-24">
          <div className="mb-4 text-pink-300">
            <Flower2 className="h-8 w-8" strokeWidth={1} />
          </div>
          <h1 className="mb-3 font-serif text-4xl font-normal tracking-wide text-gray-900 md:text-5xl">
            About Us
          </h1>
          <p className="text-sm tracking-widest text-gray-500 uppercase">
            Where flowers are our inspiration
          </p>
        </section>

        {/* SECTION 1 */}
        <section className="container mx-auto px-4 py-12 md:px-8 md:py-16">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1563241527-3004b7be0ff9?w=800&q=80"
                alt="Florist holding a bouquet"
                className="aspect-4/5 w-full rounded-sm object-cover shadow-sm"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="mb-6 font-serif text-3xl leading-tight text-gray-900 md:text-4xl">
                We take <span className="text-pink-600">flowers</span> personally & we bring you happiness
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-gray-600 md:text-base">
                <p>
                  We believe that flowers are more than just petals and stems; they are messengers of emotion. Every bouquet we create is a labor of love, handcrafted by our dedicated florists who take pride in selecting only the freshest, most vibrant blooms from trusted local growers.
                </p>
                <p>
                  Whether you&apos;re celebrating a milestone, expressing gratitude, or simply saying &ldquo;I&apos;m thinking of you,&rdquo; we are honored to be a part of your special moments. Our commitment to quality and attention to detail ensures that every arrangement speaks the words your heart cannot express.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 */}
        <section className="container mx-auto px-4 py-12 md:px-8 md:py-16">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="order-1 lg:order-1">
              <h2 className="mb-6 font-serif text-3xl leading-tight text-gray-900 md:text-4xl">
                Let us arrange a <span className="text-pink-600">smile</span> for you
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-gray-600 md:text-base">
                <p>
                  Crafting the perfect arrangement requires a delicate balance of art and nature. Our team of expert florists pours their creativity and passion into every design, ensuring that each bouquet is as unique as the person receiving it.
                </p>
                <p>
                  Whether you prefer the timeless elegance of roses or the vibrant cheer of tulips, we are here to help you express your feelings through the language of flowers. Let us bring a smile to your loved one&apos;s face today with a thoughtful, hand-arranged gift that speaks from the heart.
                </p>
              </div>
            </div>
            <div className="order-2 lg:order-2">
              <img
                src="https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=800&q=80"
                alt="Florist arranging flowers"
                className="aspect-4/5 w-full rounded-sm object-cover shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3 */}
        <section className="container mx-auto px-4 py-20 md:px-8 md:py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-serif text-3xl text-gray-900 md:text-4xl">
              Our Signature Collections
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
              Discover our curated selections, thoughtfully designed to bring beauty, joy, and a touch of nature into every space.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {flowerShowcase.map((item) => (
              <div key={item.name} className="text-center">
                <div className="mb-6 overflow-hidden rounded-sm shadow-sm">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <h3 className="mb-1 font-serif text-xl text-gray-900">
                  {item.name}
                </h3>
                <p className="text-sm tracking-wider text-gray-500 uppercase">
                  {item.role}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#F4F4F4] pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <h3 className="mb-6 text-sm font-semibold text-gray-900">
                Customer Service
              </h3>
              <ul className="space-y-3">
                {footerLinks.customerService.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-pink-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-sm font-semibold text-gray-900">
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-pink-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-sm font-semibold text-gray-900">
                Social Media
              </h3>
              <ul className="space-y-3">
                {footerLinks.socialMedia.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-pink-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 border-t border-gray-200 pt-8 text-center">
            <p className="text-xs text-gray-400">
              Copyright © 2026. All rights reserved. Powered by Flowery.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}