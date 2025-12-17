'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase, OrusProduct } from '@/lib/supabase';
import { CheckCircle, XCircle, ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react';

interface ProductWithSeller extends OrusProduct {
  seller: {
    email: string;
    full_name: string;
    numero_client: string;
    phone_number?: string;
    address?: string;
  };
}

export default function ProductDetailPage() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('orus_products')
        .select(`
          *,
          seller:orus_users!seller_id (
            email,
            full_name,
            numero_client,
            phone_number,
            address
          )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateModeration = async (status: 'APPROVED' | 'REJECTED') => {
    if (!product) return;

    try {
      const { error } = await supabase
        .from('orus_products')
        .update({
          status_moderation: status,
          status_logistique: status === 'APPROVED' ? 'CONTROLE_OK' : product.status_logistique,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (error) {
        console.error('Error updating moderation:', error);
        alert('Failed to update product status. Please try again.');
        return;
      }
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating moderation:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-finland-blue text-xl">{t('loading')}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-finland-blue hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('back')}
        </button>
        <div className="text-center py-12">
          <p className="text-gray-500">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-finland-blue hover:text-blue-700 font-semibold"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('back')}
      </button>

      <h1 className="text-3xl font-bold text-finland-blue">Product Verification</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Seller Information</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Client Number</p>
                <p className="font-semibold text-gray-900">{product.seller?.numero_client || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-semibold text-gray-900">{product.seller?.full_name || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-900">{product.seller?.email || 'N/A'}</p>
              </div>
            </div>

            {product.seller?.phone_number && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-900">{product.seller.phone_number}</p>
                </div>
              </div>
            )}

            {product.seller?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-semibold text-gray-900">{product.seller.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>

          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Title</p>
              <p className="text-xl font-bold text-gray-900">{product.title}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="text-2xl font-bold text-finland-blue">€{product.price.toFixed(2)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-semibold text-gray-900">{product.category}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-700">{product.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <p className="text-sm text-gray-500">Moderation Status</p>
                <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                  product.status_moderation === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  product.status_moderation === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {product.status_moderation}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Logistics Status</p>
                <span className="inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {product.status_logistique}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-gray-700">
                {new Date(product.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {product.status_moderation === 'PENDING' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Moderation Actions</h3>
          <div className="flex gap-4">
            <button
              onClick={() => updateModeration('APPROVED')}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Product
            </button>
            <button
              onClick={() => updateModeration('REJECTED')}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Reject Product
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
