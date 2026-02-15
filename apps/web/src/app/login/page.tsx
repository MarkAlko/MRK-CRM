'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  if (!loading && user) {
    router.replace('/dashboard');
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ email, password });
      router.replace('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'שגיאה בהתחברות');
      } else {
        setError('שגיאה בהתחברות');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">MRK CRM</h1>
            <p className="text-gray-500 text-sm">כניסה למערכת</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                דוא&quot;ל
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                           outline-none transition placeholder:text-gray-400"
                placeholder="your@email.com"
                dir="ltr"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                סיסמה
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                           outline-none transition placeholder:text-gray-400"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium
                         text-white hover:bg-blue-700 focus:outline-none focus:ring-2
                         focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed
                         transition"
            >
              {submitting ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
