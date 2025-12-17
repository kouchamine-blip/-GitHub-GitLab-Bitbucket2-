'use client';

import { Shield, Truck, Lock, Sparkles } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { useState, useRef, useEffect } from 'react';

export function HybridBanner() {
  const { t } = useLocale();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const slides = [
    {
      icon: Shield,
      badge: t('hybridAdvantage'),
      title: t('secureExchange'),
      description: t('secureExchangeDesc'),
      gradient: 'from-tarina-brown to-tarina-brown-dark dark:from-stone-700 dark:to-stone-800',
    },
    {
      icon: Lock,
      badge: 'Escrow Protection',
      title: 'Payment Security',
      description: 'Your money is safe until you confirm the item.',
      gradient: 'from-stone-600 to-stone-700 dark:from-stone-700 dark:to-stone-800',
    },
    {
      icon: Truck,
      badge: 'Easy Pickup',
      title: 'Store Verification',
      description: 'Items are checked before you collect them.',
      gradient: 'from-neutral-600 to-neutral-700 dark:from-neutral-700 dark:to-neutral-800',
    },
    {
      icon: Sparkles,
      badge: 'Quality First',
      title: 'Verified Items',
      description: 'Every item passes our quality check.',
      gradient: 'from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800',
    },
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
    if (touchStart - touchEnd < -75) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];
  const Icon = currentSlideData.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-xl h-44">
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative bg-gradient-to-br ${currentSlideData.gradient} p-6 transition-all duration-500 h-full`}
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10">
          <div className="absolute inset-0 flex items-center justify-end pr-8">
            <Icon className="w-48 h-48" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="inline-block bg-white/90 dark:bg-tarina-amber px-3 py-1 rounded-full mb-3 shadow-md">
            <span className="text-xs font-bold text-tarina-brown dark:text-white uppercase tracking-wide">
              {currentSlideData.badge}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
            {currentSlideData.title}
          </h2>

          <p className="text-tarina-cream dark:text-tarina-beige text-sm drop-shadow">
            {currentSlideData.description}
          </p>
        </div>

        <div className="absolute top-1/2 right-8 -translate-y-1/2">
          <div className="w-16 h-16 bg-white/20 dark:bg-tarina-amber/20 rounded-full flex items-center justify-center">
            <Icon className="w-10 h-10 text-white dark:text-tarina-amber" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white dark:bg-tarina-amber w-6 shadow-lg'
                : 'bg-white/40 dark:bg-white/40 hover:bg-white/60 dark:hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
