'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/tarina/ProductCard';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  category: string;
  created_at: string;
  seller_id: string;
}

type SortOption = 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc';

export default function FindPage() {
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', label: t('all') },
    { id: 'CLOTHING', label: t('clothing') },
    { id: 'FURNITURE', label: t('furniture') },
    { id: 'ELECTRONICS', label: t('electronics') },
    { id: 'BOOKS', label: t('books') },
    { id: 'ART', label: t('art') },
    { id: 'OTHER', label: t('other') },
  ];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orus_products')
        .select('id, title, price, image_url, category, created_at, status_moderation, conformity_status, seller_id')
        .eq('status_moderation', 'APPROVED')
        .is('buyer_id', null)
        .neq('conformity_status', 'NON_CONFORME');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      switch (sortBy) {
        case 'date_desc':
          query = query.order('created_at', { ascending: false });
          break;
        case 'date_asc':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortOptions = [
    { id: 'date_desc', label: 'Newest First' },
    { id: 'date_asc', label: 'Oldest First' },
    { id: 'price_asc', label: 'Price: Low to High' },
    { id: 'price_desc', label: 'Price: High to Low' },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 min-h-screen bg-tarina-offwhite dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-tarina-brown dark:text-tarina-amber">
          {t('find')} Treasure
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-tarina-beige-light dark:bg-gray-800 hover:bg-tarina-beige dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <SlidersHorizontal className="w-5 h-5 text-tarina-brown dark:text-gray-300" />
          <span className="text-sm font-medium text-tarina-brown dark:text-gray-300">Sort</span>
        </button>
      </div>

      {showFilters && (
        <div className="bg-tarina-cream dark:bg-gray-800 rounded-2xl p-4 border border-tarina-beige dark:border-gray-700 space-y-3 shadow-lg">
          <h3 className="text-sm font-semibold text-tarina-brown dark:text-white mb-2">Sort By</h3>
          <div className="grid grid-cols-2 gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setSortBy(option.id as SortOption);
                  setShowFilters(false);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  sortBy === option.id
                    ? 'bg-tarina-orange dark:bg-tarina-amber text-white shadow-md'
                    : 'bg-tarina-beige-light dark:bg-gray-700 text-tarina-brown dark:text-gray-300 hover:bg-tarina-beige dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tarina-brown-light dark:text-gray-400" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-tarina-beige dark:border-gray-700 bg-tarina-cream dark:bg-gray-800 text-tarina-brown dark:text-white placeholder-tarina-brown-light dark:placeholder-gray-400 focus:ring-2 focus:ring-tarina-orange dark:focus:ring-tarina-amber focus:border-transparent transition-all shadow-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-tarina-orange dark:bg-tarina-amber text-white shadow-lg'
                : 'bg-tarina-beige-light dark:bg-gray-800 text-tarina-brown dark:text-gray-300 hover:bg-tarina-beige dark:hover:bg-gray-700 border border-tarina-beige dark:border-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-tarina-orange dark:text-tarina-amber text-xl font-semibold">Loading...</div>
        </div>
      ) : (
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
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-tarina-brown-light dark:text-gray-400 text-lg">No products found</p>
        </div>
      )}
    </div>
  );
}
