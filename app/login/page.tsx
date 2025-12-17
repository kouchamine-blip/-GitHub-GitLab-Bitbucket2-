'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/i18n/LocaleContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  const { t, locale, setLocale } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-finland-blue">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 mx-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-finland-blue">ORUS</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1 rounded ${
                locale === 'en'
                  ? 'bg-finland-blue text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale('fi')}
              className={`px-3 py-1 rounded ${
                locale === 'fi'
                  ? 'bg-finland-blue text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              FI
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue"
              placeholder="admin@orus.fi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finland-blue"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-finland-blue text-white rounded-lg font-medium hover:bg-finland-blue-light transition-colors disabled:opacity-50"
          >
            {loading ? t('loading') : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
