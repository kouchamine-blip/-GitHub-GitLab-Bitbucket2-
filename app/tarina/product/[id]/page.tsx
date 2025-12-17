'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Heart, MessageCircle, Shield, BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[];
  category: string;
  seller_id: string;
  seller?: {
    id: string;
    full_name: string;
    is_verified_seller: boolean;
    avatar_url?: string;
  };
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isOwnProduct, setIsOwnProduct] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('orus_products')
        .select('*')
        .eq('id', params.id)
        .single();

      if (productError) throw productError;

      let enrichedProduct: Product = productData as Product;

      if (productData && productData.seller_id) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('orus_users')
          .select('id, full_name, is_verified_seller, avatar_url')
          .eq('id', productData.seller_id)
          .maybeSingle();

        if (!sellerError && sellerData) {
          enrichedProduct = {
            ...productData,
            seller: sellerData
          };
        }
      }

      setProduct(enrichedProduct);

      if (user && enrichedProduct) {
        setIsOwnProduct(enrichedProduct.seller_id === user.id);

        const { data: likeData } = await supabase
          .from('orus_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', enrichedProduct.id)
          .maybeSingle();

        setIsLiked(!!likeData);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      router.push('/tarina/login');
      return;
    }

    if (!product) return;

    try {
      if (isLiked) {
        await supabase
          .from('orus_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        setIsLiked(false);
      } else {
        await supabase
          .from('orus_likes')
          .insert([
            {
              user_id: user.id,
              product_id: product.id,
            },
          ]);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleMakeOffer = async () => {
    if (!user || !product) {
      router.push('/tarina/login');
      return;
    }

    try {
      const { data: existingConversation, error: fetchError } = await supabase
        .from('orus_conversations')
        .select('id')
        .eq('product_id', product.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', product.seller_id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let conversationId: string;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        const { data: newConversation, error: insertError } = await supabase
          .from('orus_conversations')
          .insert([
            {
              product_id: product.id,
              buyer_id: user.id,
              seller_id: product.seller_id,
            },
          ])
          .select('id')
          .single();

        if (insertError) throw insertError;
        conversationId = newConversation.id;
      }

      router.push(`/tarina/chat?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleBuy = async () => {
    if (!user || !product) {
      router.push('/tarina/login');
      return;
    }

    try {
      const { data: transactionData, error: transactionError } = await supabase
        .from('orus_transactions')
        .insert([
          {
            product_id: product.id,
            buyer_id: user.id,
            seller_id: product.seller_id,
            montant_total: product.price * 1.1,
            commission_plateforme: product.price * 0.1,
            montant_vendeur_net: product.price,
            payment_method: 'WALLET',
            funds_released: false,
          },
        ])
        .select('id')
        .single();

      if (transactionError) throw transactionError;

      const { error: updateError } = await supabase
        .from('orus_products')
        .update({
          buyer_id: user.id,
          status_logistique: 'VENDU'
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      router.push('/tarina/profile');
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tarina-offwhite dark:bg-gray-900">
        <div className="text-tarina-orange dark:text-tarina-amber text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tarina-offwhite dark:bg-gray-900">
        <div className="text-tarina-brown-light dark:text-gray-400">Product not found</div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];
  const totalImages = images.length;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-6 min-h-screen bg-tarina-offwhite dark:bg-gray-900">
      <div className="relative aspect-square">
        <img
          src={images[currentImageIndex]}
          alt={`${product.title} ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {totalImages > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-tarina-cream/95 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform border border-tarina-beige dark:border-gray-700"
            >
              <ChevronLeft className="w-6 h-6 text-tarina-brown dark:text-gray-300" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-tarina-cream/95 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform border border-tarina-beige dark:border-gray-700"
            >
              <ChevronRight className="w-6 h-6 text-tarina-brown dark:text-gray-300" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'bg-tarina-orange dark:bg-tarina-amber w-6'
                      : 'bg-tarina-cream/80 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <button
          onClick={handleLike}
          className="absolute top-6 right-6 w-12 h-12 rounded-full bg-tarina-cream/95 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform border border-tarina-beige dark:border-gray-700"
        >
          <Heart
            className={`w-6 h-6 ${
              isLiked
                ? 'fill-tarina-orange text-tarina-orange dark:fill-red-500 dark:text-red-500'
                : 'text-tarina-brown dark:text-gray-400'
            }`}
          />
        </button>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-tarina-brown dark:text-white mb-2">
            {product.title}
          </h1>
          <button
            onClick={() => router.push(`/tarina/seller/${product.seller_id}`)}
            className="flex items-center space-x-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tarina-amber to-tarina-amber-dark flex items-center justify-center">
              {product.seller?.avatar_url ? (
                <img
                  src={product.seller.avatar_url}
                  alt={product.seller.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {product.seller?.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <span className="text-tarina-brown-light dark:text-gray-400 group-hover:text-tarina-amber dark:group-hover:text-tarina-amber transition-colors">
              {product.seller?.full_name || 'Unknown seller'}
            </span>
            {product.seller?.is_verified_seller && (
              <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500" />
            )}
          </button>
        </div>

        <div className="bg-tarina-cream dark:bg-gray-800 rounded-2xl p-4 border border-tarina-beige dark:border-gray-700 shadow-sm">
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-4xl font-bold text-tarina-orange dark:text-tarina-amber">
              {product.price}€
            </span>
          </div>
          <div className="flex items-center text-sm text-tarina-brown-light dark:text-gray-400">
            <Shield className="w-4 h-4 mr-1" />
            <span>
              {(product.price * 1.1).toFixed(2)}€ {t('inProtection')}
            </span>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-tarina-brown dark:text-white mb-2">
            {t('description')}
          </h2>
          <p className="text-tarina-brown-light dark:text-gray-400 leading-relaxed">
            {product.description}
          </p>
        </div>

        {!isOwnProduct && (
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={handleMakeOffer}
              className="flex items-center justify-center space-x-2 bg-tarina-beige-light dark:bg-gray-700 hover:bg-tarina-beige dark:hover:bg-gray-600 text-tarina-brown dark:text-white font-semibold py-4 px-6 rounded-xl transition-colors border border-tarina-beige dark:border-gray-600"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t('makeOffer')}</span>
            </button>

            <button
              onClick={handleBuy}
              className="bg-tarina-orange dark:bg-tarina-amber hover:bg-tarina-orange-dark dark:hover:bg-tarina-amber-dark text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg"
            >
              {t('buy')}
            </button>
          </div>
        )}

        {isOwnProduct && (
          <div className="bg-tarina-cream dark:bg-gray-800 rounded-2xl p-4 border border-tarina-beige dark:border-gray-700 text-center">
            <p className="text-tarina-brown dark:text-gray-300 font-medium">
              This is your listing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
