'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check session and redirect if user already has a goal
  const checkSession = useCallback(async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) {
        router.push('/auth');
        return;
      }

      const sessionData = await sessionRes.json();
      if (!sessionData.authenticated) {
        router.push('/auth');
        return;
      }

      setUserId(sessionData.user.userId);

      // Check if user already has a goal
      const goalRes = await fetch(`/api/user/goal?userId=${sessionData.user.userId}`);
      if (goalRes.ok) {
        const goalData = await goalRes.json();
        if (goalData.goal) {
          // Already has a goal — go to dashboard
          router.push('/dashboard');
          return;
        }
      }
    } catch {
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || !userId) return;

    setError('');
    setIsValidating(true);

    try {
      const res = await fetch('/api/user/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, goal: goal.trim() }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError(data.message || 'Please provide a valid learning goal.');
        setIsValidating(false);
        return;
      }

      // Success!
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4">
      <div className="w-full max-w-lg">
        {/* Success state */}
        {isSuccess ? (
          <div className="bg-white rounded-2xl shadow-2xl p-10 text-center animate-[fadeIn_0.5s_ease-out]">
            <div className="text-7xl mb-6">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">You&apos;re all set!</h2>
            <p className="text-gray-600">Redirecting to your personalized dashboard...</p>
            <div className="mt-6">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎯</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                What&apos;s your learning goal?
              </h1>
              <p className="text-gray-600 leading-relaxed">
                Tell us what you want to achieve and we&apos;ll personalize your
                learning experience with courses tailored just for you.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="goal" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Learning Goal
                </label>
                <textarea
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., I want to become a full-stack web developer and learn React, Node.js, and databases"
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-gray-700 text-sm resize-none transition-all duration-200 placeholder-gray-400"
                  disabled={isValidating}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {goal.length}/500
                </p>
              </div>

              <button
                type="submit"
                disabled={isValidating || goal.trim().length < 5}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isValidating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Validating your goal...
                  </span>
                ) : (
                  'Set My Goal →'
                )}
              </button>
            </form>

            {/* Examples */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Example Goals
              </p>
              <div className="space-y-2">
                {[
                  'I want to learn full-stack web development with React and Node.js',
                  'Become a machine learning engineer and master Python and TensorFlow',
                  'Learn cloud computing and DevOps to deploy scalable applications',
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setGoal(example)}
                    disabled={isValidating}
                    className="w-full text-left text-sm text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors duration-150 disabled:opacity-50"
                  >
                    💡 {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
