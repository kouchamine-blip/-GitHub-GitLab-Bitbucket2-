'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star, BadgeCheck } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface SellerProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  is_verified_seller: boolean;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
}

export default function SellerProfilePage() {
  const params = useParams();
  const { t } = useLocale();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchSellerProfile();
      fetchSellerProducts();
    }
  }, [params.id]);

  const fetchSellerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('orus_users')
        .select('id, full_name, email, avatar_url, is_verified_seller, created_at')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setSeller(data);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('orus_products')
        .select('id, title, price, image_url, conformity_status')
        .eq('seller_id', params.id)
        .eq('status_moderation', 'APPROVED')
        .is('buyer_id', null)
        .neq('conformity_status', 'NON_CONFORME')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching seller products:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-tarina-amber text-xl">Loading...</div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Seller not found</div>
      </div>
    );
  }

  const memberSince = new Date(seller.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-tarina-amber to-tarina-amber-dark mx-auto flex items-center justify-center shadow-xl">
          {seller.avatar_url ? (
            <img
              src={seller.avatar_url}
              alt={seller.full_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-4xl font-bold text-white">
              {seller.full_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {seller.full_name}
            </h1>
            {seller.is_verified_seller && (
              <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500" />
            )}
          </div>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Star className="w-4 h-4 text-tarina-amber fill-tarina-amber" />
            <span className="text-tarina-amber font-semibold">{t('new')}</span>
            <span className="text-gray-500">(0)</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Member since {memberSince}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('listings')} ({products.length})
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <Link key={product.id} href={`/tarina/product/${product.id}`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="aspect-square">
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                  {product.title}
                </h3>
                <p className="text-tarina-amber font-bold">{product.price}€</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No listings available
        </div>
      )}
    </div>
  );
}
