'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase, OrusProduct } from '@/lib/supabase';
import { CheckCircle, XCircle, Eye, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface ProductWithSeller extends OrusProduct {
  listing_serial: string;
  conformity_status: 'PENDING' | 'CONFORME' | 'NON_CONFORME';
  conformity_checked_at: string | null;
  conformity_checked_by: string | null;
  seller: {
    email: string;
    full_name: string;
  };
}

export default function ProductsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSeller | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('orus_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      if (productsData && productsData.length > 0) {
        const sellerIds = [...new Set(productsData.map(p => p.seller_id).filter(Boolean))];

        const { data: sellersData, error: sellersError } = await supabase
          .from('orus_users')
          .select('id, email, full_name')
          .in('id', sellerIds);

        if (!sellersError && sellersData) {
          const sellersMap = new Map(sellersData.map(s => [s.id, s]));
          const productsWithSellers = productsData.map(product => ({
            ...product,
            seller: product.seller_id ? sellersMap.get(product.seller_id) : null
          }));
          setProducts(productsWithSellers as ProductWithSeller[]);
        } else {
          setProducts(productsData as ProductWithSeller[]);
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateModeration = async (productId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const { error } = await supabase
        .from('orus_products')
        .update({ status_moderation: status, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) {
        console.error('Error updating moderation:', error);
        alert('Failed to update product status. Please try again.');
        return;
      }
      fetchProducts();
    } catch (error) {
      console.error('Error updating moderation:', error);
      alert('Failed to update product status. Please try again.');
    }
  };

  const updateConformity = async (productId: string, status: 'CONFORME' | 'NON_CONFORME') => {
    if (!user) {
      alert('You must be logged in to perform this action.');
      return;
    }

    try {
      if (status === 'NON_CONFORME') {
        const { error } = await supabase
          .from('orus_products')
          .update({
            status_moderation: 'BANNED_BY_MODERATOR',
            conformity_status: status,
            conformity_checked_at: new Date().toISOString(),
            conformity_checked_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (error) {
          console.error('Error updating conformity:', error);
          alert('Failed to update product conformity. Please try again.');
          return;
        }

        await supabase
          .from('orus_likes')
          .delete()
          .eq('product_id', productId);
      } else {
        const { error } = await supabase
          .from('orus_products')
          .update({
            conformity_status: status,
            conformity_checked_at: new Date().toISOString(),
            conformity_checked_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (error) {
          console.error('Error updating conformity:', error);
          alert('Failed to update product conformity. Please try again.');
          return;
        }
      }

      setShowModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating conformity:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const openProductModal = (product: ProductWithSeller) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setShowModal(true);
  };

  const getProductImages = (product: ProductWithSeller): string[] => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if (product.image_url) {
      return [product.image_url];
    }
    return [];
  };

  const nextImage = () => {
    if (!selectedProduct) return;
    const images = getProductImages(selectedProduct);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!selectedProduct) return;
    const images = getProductImages(selectedProduct);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getConformityIcon = (status: string) => {
    switch (status) {
      case 'CONFORME':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'NON_CONFORME':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PENDING':
      default:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getListingStatus = (product: ProductWithSeller) => {
    if (product.buyer_id) {
      return { label: 'SOLD', color: 'bg-blue-100 text-blue-800' };
    }
    if (product.status_moderation === 'BANNED_BY_SELLER') {
      return { label: 'DELETED BY CUSTOMER', color: 'bg-gray-100 text-gray-800' };
    }
    if (product.conformity_status === 'NON_CONFORME') {
      return { label: 'NON CONFORME', color: 'bg-red-100 text-red-800' };
    }
    if (product.status_moderation === 'REJECTED') {
      return { label: 'REJECTED', color: 'bg-orange-100 text-orange-800' };
    }
    if (product.status_moderation === 'APPROVED') {
      return { label: 'ACTIVE', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'PENDING', color: 'bg-yellow-100 text-yellow-800' };
  };

  if (loading) {
    return <div className="text-finland-blue text-xl">{t('loading')}</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-finland-blue">{t('products')} - Listing Tracking</h1>
          <div className="text-sm text-gray-600">
            Total Listings: <span className="font-bold text-finland-blue">{products.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-finland-blue">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Listing #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Conformity
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const listingStatus = getListingStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-bold text-finland-blue">
                            {product.listing_serial || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.seller?.full_name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.seller?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {product.title}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-gray-700 uppercase">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            €{product.price.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${listingStatus.color}`}>
                            {listingStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center">
                            {getConformityIcon(product.conformity_status)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => openProductModal(product)}
                            className="inline-flex items-center px-4 py-2 bg-finland-blue hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Check Product
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-finland-blue">Product Conformity Check</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Listing: <span className="font-mono font-bold">{selectedProduct.listing_serial}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {(() => {
                const images = getProductImages(selectedProduct);
                if (images.length === 0) return null;

                return (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-3 block">
                      Product Images ({currentImageIndex + 1}/{images.length})
                    </label>
                    <div className="relative">
                      <img
                        src={images[currentImageIndex]}
                        alt={`${selectedProduct.title} ${currentImageIndex + 1}`}
                        className="w-full max-h-[600px] object-contain bg-gray-100 rounded-lg shadow-md"
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                          >
                            <ChevronLeft className="w-6 h-6 text-gray-800" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                          >
                            <ChevronRight className="w-6 h-6 text-gray-800" />
                          </button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentImageIndex
                                    ? 'bg-white w-6'
                                    : 'bg-white/50 hover:bg-white/75'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Customer</label>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedProduct.seller?.full_name}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Title</label>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedProduct.title}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Category</label>
                  <p className="text-base text-gray-700">{selectedProduct.category}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Price</label>
                  <p className="text-2xl font-bold text-finland-blue">
                    €{selectedProduct.price.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Listing Status</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getListingStatus(selectedProduct).color}`}>
                      {getListingStatus(selectedProduct).label}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Conformity Status</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getConformityIcon(selectedProduct.conformity_status)}
                    <span className="text-base font-medium text-gray-900">
                      {selectedProduct.conformity_status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Description</label>
                <p className="text-base text-gray-700 mt-2 leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Conformity Assessment
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateConformity(selectedProduct.id, 'CONFORME')}
                    className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg"
                  >
                    <CheckCircle className="w-6 h-6" />
                    <span>Conforme</span>
                  </button>
                  <button
                    onClick={() => updateConformity(selectedProduct.id, 'NON_CONFORME')}
                    className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg"
                  >
                    <XCircle className="w-6 h-6" />
                    <span>Non-Conforme</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
