'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Package, QrCode } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ProductWithCodes {
  id: string;
  title: string;
  deposit_code: string | null;
  withdrawal_code: string | null;
  status_logistique: string;
}

export default function LogisticsPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithCodes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orus_products')
        .select('id, title, deposit_code, withdrawal_code, status_logistique')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <Link
        href="/tarina/profile"
        className="inline-flex items-center space-x-2 text-tarina-amber hover:text-tarina-amber-dark mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t('back')}</span>
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-tarina-brown dark:text-tarina-amber mb-2">
          {t('logistics')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your deposit and withdrawal codes
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-tarina-amber">Loading...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No products with logistics codes yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-md p-6 space-y-4"
            >
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status: {product.status_logistique}
                </p>
              </div>

              {product.deposit_code && (
                <div className="bg-tarina-cream dark:bg-gray-700 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <QrCode className="w-5 h-5 text-tarina-amber" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {t('depositCode')}
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-tarina-amber">
                    {product.deposit_code}
                  </div>
                </div>
              )}

              {product.withdrawal_code && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <QrCode className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      {t('withdrawalCode')}
                    </span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-green-600 dark:text-green-400">
                    {product.withdrawal_code}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
