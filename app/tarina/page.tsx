'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/tarina/ProductCard';
import { HybridBanner } from '@/components/tarina/HybridBanner';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  seller_id: string;
}

export default function TarinaFeedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/tarina/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const { data: likedProducts } = await supabase
        .from('orus_likes')
        .select('orus_products(category)')
        .eq('user_id', user.id);

      const likedCategories = Array.from(
        new Set(
          likedProducts
            ?.map((like: any) => like.orus_products?.category)
            .filter(Boolean) || []
        )
      );

      const { data: searchHistory } = await supabase
        .from('orus_user_search_history')
        .select('category')
        .eq('user_id', user.id)
        .not('category', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      const searchedCategories = Array.from(
        new Set(searchHistory?.map((s) => s.category).filter(Boolean) || [])
      );

      const preferredCategories = [...new Set([...likedCategories, ...searchedCategories])];

      let query = supabase
        .from('orus_products')
        .select('id, title, price, image_url, category, conformity_status, created_at, seller_id')
        .eq('status_moderation', 'APPROVED')
        .is('buyer_id', null)
        .neq('conformity_status', 'NON_CONFORME');

      if (preferredCategories.length > 0) {
        const { data: preferredProducts } = await query
          .in('category', preferredCategories)
          .order('created_at', { ascending: false })
          .limit(20);

        const { data: otherProducts } = await supabase
          .from('orus_products')
          .select('id, title, price, image_url, category, conformity_status, created_at, seller_id')
          .eq('status_moderation', 'APPROVED')
          .is('buyer_id', null)
          .neq('conformity_status', 'NON_CONFORME')
          .not('category', 'in', `(${preferredCategories.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(10);

        const allProducts = [...(preferredProducts || []), ...(otherProducts || [])];
        allProducts.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });

        setProducts(allProducts);
      } else {
        const { data, error } = await query.order('created_at', { ascending: false }).limit(30);

        if (error) throw error;

        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tarina-offwhite dark:bg-gray-900">
        <div className="text-tarina-orange dark:text-tarina-amber text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 min-h-screen bg-tarina-offwhite dark:bg-gray-900">
      <HybridBanner />

      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            price={product.price}
            imageUrl={product.image_url}
          />
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-tarina-brown-light dark:text-gray-400">No products available</p>
        </div>
      )}
    </div>
  );
}
