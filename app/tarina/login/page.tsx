'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/i18n/LocaleContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/tarina');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-tarina-cream to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
            <Image
              src="/image copy.png"
              alt="Tarina Logo"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-tarina-brown dark:text-tarina-amber mb-2">
            Tarina
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {t('tarinaTagline')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('logIn')}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('email')}
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('password')}
                </label>
                <Link
                  href="/tarina/forgot-password"
                  className="text-xs text-tarina-amber hover:text-tarina-amber-dark font-medium"
                >
                  {t('forgotPassword')}?
                </Link>
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tarina-amber hover:bg-tarina-amber-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? t('loading') : t('logIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dontHaveAccount')}{' '}
              <Link
                href="/tarina/signup"
                className="text-tarina-amber hover:text-tarina-amber-dark font-semibold"
              >
                {t('signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
