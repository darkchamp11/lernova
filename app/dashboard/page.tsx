'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Content } from '@/src/db/schema';

interface SessionUser {
  userId: number;
  email: string;
  name: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [recommendations, setRecommendations] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');
  const router = useRouter();

  const fetchRecommendations = useCallback(async (userId: number) => {
    try {
      const response = await fetch(`/api/recommend?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
        setSource(data.source);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          await fetchRecommendations(data.user.userId);
        } else {
          // No authenticated user, redirect to auth page
          router.push('/auth');
        }
      } else {
        // No session exists (401), redirect to auth page
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      router.push('/auth');
    }
  }, [fetchRecommendations, router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleUpdateProgress = async (contentId: number) => {
    if (!user) return;

    try {
      // Find the course being started
      const course = recommendations.find(r => r.id === contentId);
      
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          contentId,
          score: Math.floor(Math.random() * 100),
          timeSpent: Math.floor(Math.random() * 60),
          completed: Math.random() > 0.5 ? 1 : 0,
        }),
      });

      if (response.ok) {
        // Show a more user-friendly message
        console.log(`📚 Progress tracked for: ${course?.title}`);
        console.log('🔄 Fetching updated recommendations based on your learning...');
        
        // Refresh recommendations (cache will be invalidated, new recommendations fetched)
        await fetchRecommendations(user.userId);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Personalized Learning Platform</h1>
              {user && (
                <p className="text-lg text-gray-600">
                  Welcome back, <span className="font-semibold">{user.name}</span>!
                </p>
              )}
              {source && (
                <p className="text-sm text-gray-500 mt-2">
                  Recommendations loaded from: <span className="font-mono">{source}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/chat')}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                AI Tutor
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Recommended Courses</h2>

          {recommendations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">No recommendations available yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Please run the seed script to populate the database.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 flex-1">{course.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          course.difficulty === 'beginner'
                            ? 'bg-green-100 text-green-800'
                            : course.difficulty === 'intermediate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {course.difficulty}
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-sm font-medium">
                        {course.topic}
                      </span>
                    </div>

                    {course.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {course.description}
                      </p>
                    )}

                    {course.keywords && course.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {course.keywords.slice(0, 3).map((keyword) => (
                          <span
                            key={keyword}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleUpdateProgress(course.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Start Learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
