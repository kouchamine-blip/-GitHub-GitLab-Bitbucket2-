'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Camera, CreditCard, Package, LogOut, QrCode, ChevronRight } from 'lucide-react';
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

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activeSection, setActiveSection] = useState<'personal' | 'banking' | 'logistics' | 'menu'>('menu');
  const [products, setProducts] = useState<ProductWithCodes[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    iban: profile?.iban || '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user && activeSection === 'logistics') {
      fetchProducts();
    }
  }, [user, activeSection]);

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
      setLoadingProducts(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const updateData: any = {
        full_name: formData.fullName,
        iban: formData.iban,
      };

      if (avatarPreview && avatarPreview !== profile?.avatar_url) {
        updateData.avatar_url = avatarPreview;
      }

      const { error } = await supabase
        .from('orus_users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      if (formData.password) {
        const { error: authError } = await supabase.auth.updateUser({
          password: formData.password,
        });
        if (authError) throw authError;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/tarina/login');
  };

  if (activeSection === 'menu') {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <Link
          href="/tarina/profile"
          className="inline-flex items-center space-x-2 text-tarina-amber hover:text-tarina-amber-dark mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('back')}</span>
        </Link>

        <h1 className="text-3xl font-bold text-tarina-brown dark:text-tarina-amber mb-6">
          Settings
        </h1>

        <div className="space-y-3">
          <button
            onClick={() => setActiveSection('personal')}
            className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-3xl p-6 flex items-center justify-between transition-colors shadow-md"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-tarina-amber/10 flex items-center justify-center">
                <User className="w-6 h-6 text-tarina-amber" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('personalData')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Profile, password & preferences
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setActiveSection('banking')}
            className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-3xl p-6 flex items-center justify-between transition-colors shadow-md"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('bankingDetails')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  IBAN & payout information
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setActiveSection('logistics')}
            className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-3xl p-6 flex items-center justify-between transition-colors shadow-md"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('logistics')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Deposit & withdrawal codes
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-3xl p-6 flex items-center justify-between transition-colors shadow-md"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-red-600 dark:text-red-400">
                  {t('logout')}
                </h3>
                <p className="text-sm text-red-500 dark:text-red-500">
                  Sign out of your account
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  if (activeSection === 'personal') {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <button
          onClick={() => setActiveSection('menu')}
          className="inline-flex items-center space-x-2 text-tarina-amber hover:text-tarina-amber-dark mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('back')}</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('personalData')}
          </h1>

          {success && (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
              Settings updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center">
              <label
                htmlFor="avatar-upload"
                className="relative cursor-pointer group"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-tarina-amber to-tarina-amber-dark flex items-center justify-center shadow-xl overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('avatarUpload')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                {t('fullName')}
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                {t('email')}
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Change Password
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    New {t('password')}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    Confirm {t('password')}
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tarina-amber hover:bg-tarina-amber-dark text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? t('loading') : t('saveChanges')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeSection === 'banking') {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <button
          onClick={() => setActiveSection('menu')}
          className="inline-flex items-center space-x-2 text-tarina-amber hover:text-tarina-amber-dark mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('back')}</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('bankingDetails')}
          </h1>

          {success && (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
              Banking details updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                {t('iban')}
              </label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
                placeholder="FI12 3456 7890 1234 56"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Your IBAN is used for payouts from product sales
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tarina-amber hover:bg-tarina-amber-dark text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? t('loading') : t('saveChanges')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeSection === 'logistics') {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <button
          onClick={() => setActiveSection('menu')}
          className="inline-flex items-center space-x-2 text-tarina-amber hover:text-tarina-amber-dark mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('back')}</span>
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-tarina-brown dark:text-tarina-amber mb-2">
            {t('logistics')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your deposit and withdrawal codes
          </p>
        </div>

        {loadingProducts ? (
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

  return null;
}
