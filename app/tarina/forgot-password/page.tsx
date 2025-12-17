'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/tarina/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-tarina-offwhite dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Check your email
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                We've sent a password reset link to:
              </p>
              <p className="font-semibold text-tarina-amber">{email}</p>
            </div>

            <div className="bg-tarina-cream dark:bg-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Click the link in the email to reset your password. If you don't see it, check your spam folder.
              </p>
            </div>

            <Link
              href="/tarina/login"
              className="block w-full bg-tarina-amber hover:bg-tarina-amber-dark text-white font-bold py-4 px-6 rounded-xl transition-colors text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tarina-offwhite dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link
          href="/tarina/login"
          className="inline-flex items-center space-x-2 text-tarina-amber hover:text-tarina-amber-dark mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Login</span>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-tarina-brown dark:text-white">
              {t('forgotPassword')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                {t('email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
                placeholder="your.email@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tarina-amber hover:bg-tarina-amber-dark text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? t('loading') : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
