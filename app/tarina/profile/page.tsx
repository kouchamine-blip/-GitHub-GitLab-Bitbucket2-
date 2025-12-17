'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Settings, Star, LogOut, Edit2, Trash2, MoreVertical, Plus, X, Camera } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description?: string;
  category?: string;
  images?: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLocale();
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    price: 0,
    description: '',
    category: '',
    image_url: '',
    images: [] as string[]
  });
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyProducts();
      fetchLikedProducts();
    }
  }, [user]);

  const fetchMyProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orus_products')
        .select('id, title, price, image_url, description, category, images')
        .eq('seller_id', user.id)
        .not('status_moderation', 'in', '(BANNED_BY_SELLER,BANNED_BY_MODERATOR)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orus_likes')
        .select(`
          product_id,
          orus_products (
            id,
            title,
            price,
            image_url,
            status_moderation,
            conformity_status,
            buyer_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const products = data
        ?.map((like: any) => like.orus_products)
        .filter((product: any) =>
          product &&
          product.status_moderation === 'APPROVED' &&
          product.conformity_status !== 'NON_CONFORME' &&
          !product.buyer_id
        ) || [];
      setLikedProducts(products);
    } catch (error) {
      console.error('Error fetching liked products:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/tarina/login');
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('orus_products')
        .update({ status_moderation: 'BANNED_BY_SELLER' })
        .eq('id', productId)
        .eq('seller_id', user?.id);

      if (error) throw error;

      await supabase
        .from('orus_likes')
        .delete()
        .eq('product_id', productId);

      setMyProducts(myProducts.filter(p => p.id !== productId));
      setShowMenu(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      price: product.price,
      description: product.description || '',
      category: product.category || '',
      image_url: product.image_url || '',
      images: product.images || []
    });
    setShowMenu(null);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || updating) return;

    if (!editForm.title.trim() || !editForm.price || !editForm.image_url) {
      alert('Please fill in all required fields (title, price, and main photo)');
      return;
    }

    setUpdating(true);

    try {
      const { data, error } = await supabase
        .from('orus_products')
        .update({
          title: editForm.title,
          price: editForm.price,
          description: editForm.description,
          category: editForm.category,
          image_url: editForm.image_url,
          images: editForm.images,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProduct.id)
        .eq('seller_id', user?.id)
        .select();

      if (error) {
        console.error('Update error details:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No product was updated. Please check permissions.');
      }

      setMyProducts(myProducts.map(p =>
        p.id === editingProduct.id
          ? {
              ...p,
              title: editForm.title,
              price: editForm.price,
              description: editForm.description,
              category: editForm.category,
              image_url: editForm.image_url,
              images: editForm.images
            }
          : p
      ));

      setEditingProduct(null);
      alert('Product updated successfully!');
    } catch (error: any) {
      console.error('Error updating product:', error);
      const errorMessage = error?.message || 'Failed to update product. Please try again.';
      alert(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleMainPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadImageToStorage(file);
    setUploading(false);

    if (url) {
      setEditForm({ ...editForm, image_url: url });
    }
  };

  const handleAddGalleryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await uploadImageToStorage(file);
    setUploading(false);

    if (url) {
      setEditForm({
        ...editForm,
        images: [...editForm.images, url]
      });
    }
  };

  const removeImageFromGallery = (index: number) => {
    setEditForm({
      ...editForm,
      images: editForm.images.filter((_, i) => i !== index)
    });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-tarina-amber text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-end mb-4">
        <Link
          href="/tarina/profile/settings"
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </Link>
      </div>

      <div className="text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-tarina-amber to-tarina-amber-dark mx-auto flex items-center justify-center shadow-xl">
          <span className="text-4xl font-bold text-white">
            {profile.full_name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile.full_name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Star className="w-4 h-4 text-tarina-amber fill-tarina-amber" />
            <span className="text-tarina-amber font-semibold">{t('new')}</span>
            <span className="text-gray-500">(0)</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-tarina-brown to-tarina-brown-dark rounded-3xl p-6 shadow-xl">
        <div className="text-tarina-beige text-sm uppercase tracking-wide mb-2">
          {t('totalBalance')}
        </div>
        <div className="text-5xl font-bold text-white mb-4">
          {profile.wallet_balance?.toFixed(2) || '0.00'}€
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/tarina/profile/payout"
            className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            <span>{t('withdraw')}</span>
          </Link>
          <Link
            href="/tarina/profile/settings"
            className="flex items-center justify-center space-x-2 bg-tarina-amber hover:bg-tarina-amber-light text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>{t('banking')}</span>
          </Link>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex-1 py-3 px-4 font-semibold transition-colors ${
            activeTab === 'listings'
              ? 'text-tarina-amber border-b-2 border-tarina-amber'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {t('listings')} ({myProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('liked')}
          className={`flex-1 py-3 px-4 font-semibold transition-colors ${
            activeTab === 'liked'
              ? 'text-tarina-amber border-b-2 border-tarina-amber'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {t('liked')} ({likedProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-3 px-4 font-semibold transition-colors ${
            activeTab === 'reviews'
              ? 'text-tarina-amber border-b-2 border-tarina-amber'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {t('reviews')} (0)
        </button>
      </div>

      <div>
        {activeTab === 'listings' && (
          <div className="grid grid-cols-2 gap-4">
            {myProducts.map((product) => (
              <div key={product.id} className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md">
                <Link href={`/tarina/product/${product.id}`}>
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
                </Link>

                <button
                  onClick={() => setShowMenu(showMenu === product.id ? null : product.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>

                {showMenu === product.id && (
                  <div className="absolute top-12 right-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                    <button
                      onClick={() => startEditProduct(product)}
                      className="w-full flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{t('edit')}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="w-full flex items-center space-x-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{t('delete')}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'liked' && (
          <>
            {likedProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No liked items yet
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {likedProducts.map((product) => (
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
            )}
          </>
        )}

        {activeTab === 'reviews' && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No reviews yet
          </div>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('editProduct')}
              </h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('mainPhoto')}
                </label>
                <div className="space-y-2">
                  {editForm.image_url ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                      <img
                        src={editForm.image_url}
                        alt="Main product"
                        className="w-full h-full object-cover"
                      />
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 flex items-center space-x-2">
                          <Camera className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t('changePhoto')}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleMainPhotoChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-tarina-amber dark:hover:border-tarina-amber flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <Camera className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t('tapToUpload')}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleMainPhotoChange}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                  {uploading && (
                    <div className="text-center text-sm text-tarina-amber">
                      {t('uploadingImage')}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('addPhoto')} ({editForm.images.length})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {editForm.images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img
                        src={img}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImageFromGallery(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-tarina-amber dark:hover:border-tarina-amber flex items-center justify-center cursor-pointer transition-colors">
                    <Plus className="w-8 h-8 text-gray-400" />
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleAddGalleryPhoto}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('title')}
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('priceEuro')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('category')}
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
                  >
                    <option value="">{t('all')}</option>
                    <option value="clothing">{t('clothing')}</option>
                    <option value="furniture">{t('furniture')}</option>
                    <option value="electronics">{t('electronics')}</option>
                    <option value="books">{t('books')}</option>
                    <option value="art">{t('art')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('description')}
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder={t('descriptionPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleUpdateProduct}
                disabled={updating || uploading}
                className="flex-1 bg-tarina-amber hover:bg-tarina-amber-dark text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? t('loading') : t('updateProduct')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
