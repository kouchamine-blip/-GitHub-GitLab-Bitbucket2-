'use client';

import { Heart, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  isLiked?: boolean;
  sellerName?: string;
  sellerId?: string;
}

export function ProductCard({ id, title, price, imageUrl, isLiked: initialLiked, sellerName, sellerId }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(initialLiked || false);
  const { t } = useLocale();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, id]);

  const checkIfLiked = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orus_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (!error && data) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('orus_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;
        setIsLiked(false);
      } else {
        const { error } = await supabase
          .from('orus_likes')
          .insert({
            user_id: user.id,
            product_id: id,
          });

        if (error) throw error;
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const protectionFee = price * 0.10;
  const totalPrice = price + protectionFee;

  return (
    <Link href={`/tarina/product/${id}`}>
      <div className="bg-tarina-cream dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-tarina-beige dark:border-gray-700">
        <div className="relative aspect-square">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleLikeToggle}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-tarina-offwhite/95 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform border border-tarina-beige dark:border-gray-700"
          >
            <Heart
              className={`w-5 h-5 ${
                isLiked
                  ? 'fill-tarina-orange text-tarina-orange'
                  : 'text-tarina-brown-light dark:text-gray-400'
              }`}
            />
          </button>
        </div>

        <div className="p-4 bg-gradient-to-b from-tarina-cream to-tarina-offwhite dark:from-gray-800 dark:to-gray-800">
          <h3 className="font-semibold text-tarina-brown dark:text-white text-lg mb-2 line-clamp-1">
            {title}
          </h3>
          {sellerName && (
            <Link href={`/tarina/seller/${sellerId}`} onClick={(e) => e.stopPropagation()}>
              <p className="text-sm text-tarina-brown-light dark:text-gray-400 hover:text-tarina-orange dark:hover:text-tarina-amber transition-colors mb-1">
                {sellerName}
              </p>
            </Link>
          )}
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-tarina-orange dark:text-tarina-amber">
              {price}€
            </span>
          </div>
          <div className="flex items-center text-xs text-tarina-brown-light dark:text-gray-400 mt-1">
            <Shield className="w-3 h-3 mr-1" />
            <span>
              {totalPrice.toFixed(2)}€ {t('inProtection')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
