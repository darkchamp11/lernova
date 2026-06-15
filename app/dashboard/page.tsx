'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { Content } from '@/src/db/schema';
import RealTimeQuiz from '@/app/components/RealTimeQuiz';
import ActiveCourses from '@/app/components/ActiveCourses';

interface SessionUser {
  userId: number;
  email: string;
  name: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  username: string;
  knowledgeVec: number[] | null;
}

interface ProgressEntry {
  id: number;
  score: number | null;
  timeSpent: number | null;
  completed: number | null;
  createdAt: string;
  contentTitle: string;
  contentTopic: string;
}

interface RecommendationData {
  recommendations: Content[];
  targetDifficulty: string;
  averageScore: number;
  source: string;
  goal: string | null;
}

// Fixed topic labels mapped to knowledge vector dimensions
const TOPIC_LABELS = ['Programming', 'Web Dev', 'CS Theory', 'AI & ML', 'DevOps'];

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentProgress, setRecentProgress] = useState<ProgressEntry[]>([]);
  const [recommendations, setRecommendations] = useState<Content[]>([]);
  const [targetDifficulty, setTargetDifficulty] = useState<string>('beginner');
  const [averageScore, setAverageScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');
  const [goal, setGoal] = useState<string | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalError, setGoalError] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);

  // Enrollment state
  const [activeEnrollmentCount, setActiveEnrollmentCount] = useState(0);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());
  const [registering, setRegistering] = useState<Record<number, boolean>>({});
  const [enrollmentKey, setEnrollmentKey] = useState(0); // triggers ActiveCourses refresh

  const router = useRouter();

  const fetchEnrollmentState = useCallback(async (uid: number) => {
    try {
      const res = await fetch(`/api/enrollments?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        const active = data.enrollments || [];
        setActiveEnrollmentCount(active.length);
        setEnrolledCourseIds(new Set(active.map((e: { course: { id: number } }) => e.course.id)));
      }
    } catch {
      // silent
    }
  }, []);

  const fetchRecommendations = useCallback(async (userId: number) => {
    try {
      const response = await fetch(`/api/recommend?userId=${userId}`);
      if (response.ok) {
        const data: RecommendationData = await response.json();
        setRecommendations(data.recommendations);
        setTargetDifficulty(data.targetDifficulty);
        setAverageScore(data.averageScore);
        setSource(data.source);
        if (data.goal !== undefined) setGoal(data.goal);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: number) => {
    try {
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setRecentProgress(data.recentProgress);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          await Promise.all([
            fetchRecommendations(data.user.userId),
            fetchProfile(data.user.userId),
            fetchEnrollmentState(data.user.userId),
          ]);
        } else {
          router.push('/auth');
        }
      } else {
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  }, [fetchRecommendations, fetchProfile, fetchEnrollmentState, router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleRegisterCourse = async (contentId: number) => {
    if (!user) return;
    setRegistering((prev) => ({ ...prev, [contentId]: true }));

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, contentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to register');
        return;
      }

      // Refresh enrollment state and ActiveCourses component
      await fetchEnrollmentState(user.userId);
      setEnrollmentKey((k) => k + 1);
    } catch (err) {
      console.error('Error registering:', err);
      alert('Failed to register for course');
    } finally {
      setRegistering((prev) => ({ ...prev, [contentId]: false }));
    }
  };

  const handleEnrollmentChange = async () => {
    if (!user) return;
    await Promise.all([
      fetchEnrollmentState(user.userId),
      fetchProfile(user.userId),
      fetchRecommendations(user.userId),
    ]);
    setEnrollmentKey((k) => k + 1);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Prepare radar chart data from knowledgeVec
  const radarData =
    profile?.knowledgeVec && profile.knowledgeVec.length > 0
      ? TOPIC_LABELS.map((label, i) => ({
          subject: label,
          value: Math.round((profile.knowledgeVec?.[i] ?? 0) * 100),
          fullMark: 100,
        }))
      : [];

  // Prepare bar chart data from recent progress
  const barData = recentProgress.map((p) => ({
    name: p.contentTitle.length > 18 ? `${p.contentTitle.slice(0, 18)}…` : p.contentTitle,
    score: p.score ?? 0,
  }));

  // Determine difficulty badge styling
  const difficultyBadge =
    {
      beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
      advanced: 'bg-red-100 text-red-700 border-red-200',
    }[targetDifficulty] ?? 'bg-gray-100 text-gray-700 border-gray-200';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Personalized Learning Platform
              </h1>
              {user && (
                <p className="text-lg text-gray-600">
                  Welcome back, <span className="font-semibold">{user.name}</span>!
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/chat')}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Profile & Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Learner Profile Card */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>👤</span> Learner Profile
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-semibold text-gray-800">{profile?.username ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-700">{profile?.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Target Difficulty</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${difficultyBadge}`}
                >
                  {targetDifficulty.charAt(0).toUpperCase() + targetDifficulty.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${averageScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{averageScore}%</span>
                </div>
              </div>
              {source && (
                <div>
                  <p className="text-sm text-gray-500">Data Source</p>
                  <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-mono">
                    {source}
                  </span>
                </div>
              )}

              {/* Learning Goal */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">🎯 Learning Goal</p>
                  {goal && !isEditingGoal && (
                    <button
                      type="button"
                      onClick={() => {
                        setGoalInput(goal);
                        setIsEditingGoal(true);
                        setGoalError('');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingGoal ? (
                  <div className="space-y-2">
                    <textarea
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none text-gray-700 text-sm resize-none"
                      placeholder="e.g., I want to learn full-stack web development"
                      disabled={goalSaving}
                    />
                    {goalError && <p className="text-xs text-red-600">{goalError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={goalSaving || goalInput.trim().length < 5}
                        onClick={async () => {
                          if (!user) return;
                          setGoalSaving(true);
                          setGoalError('');
                          try {
                            const res = await fetch('/api/user/goal', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.userId, goal: goalInput.trim() }),
                            });
                            const data = await res.json();
                            if (!data.valid) {
                              setGoalError(data.message || 'Please provide a valid learning goal.');
                            } else {
                              setGoal(goalInput.trim());
                              setIsEditingGoal(false);
                              await fetchRecommendations(user.userId);
                            }
                          } catch {
                            setGoalError('Failed to save goal.');
                          } finally {
                            setGoalSaving(false);
                          }
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors"
                      >
                        {goalSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingGoal(false);
                          setGoalError('');
                        }}
                        disabled={goalSaving}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 px-3 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : goal ? (
                  <p className="text-sm font-medium text-gray-800 leading-relaxed">{goal}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setGoalInput('');
                      setIsEditingGoal(true);
                      setGoalError('');
                    }}
                    className="w-full text-left bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm px-3 py-2 rounded-lg transition-colors"
                  >
                    + Set a learning goal to get personalized recommendations
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Knowledge Radar Chart */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🧠</span> Knowledge Profile
            </h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Knowledge"
                    dataKey="value"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                No knowledge data available
              </div>
            )}
          </div>

          {/* Progress Bar Chart */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span> Recent Scores
            </h2>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Score']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                No progress data yet — start learning!
              </div>
            )}
          </div>
        </section>

        {/* Active Courses Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            📖 My Active Courses
            <span className="text-sm font-normal text-gray-500">
              ({activeEnrollmentCount}/2 slots used)
            </span>
          </h2>
          {user && (
            <ActiveCourses
              key={enrollmentKey}
              userId={user.userId}
              onEnrollmentChange={handleEnrollmentChange}
            />
          )}
        </section>

        {/* Real-Time Knowledge Check */}
        <section className="mb-10">
          <RealTimeQuiz
            topic={recommendations[0]?.topic ?? 'Programming'}
            difficulty={targetDifficulty}
          />
        </section>

        {/* Recommended Courses */}
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
              {recommendations.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id);
                const atCapacity = activeEnrollmentCount >= 2;
                const isRegistering = registering[course.id];
                const canRegister = !isEnrolled && !atCapacity && !isRegistering;

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex-1">
                          {course.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 whitespace-nowrap ${
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
                        onClick={() => handleRegisterCourse(course.id)}
                        disabled={!canRegister}
                        className={`w-full font-semibold py-2 px-4 rounded-md transition-colors duration-200 text-sm ${
                          isEnrolled
                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                            : canRegister
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isRegistering
                          ? 'Registering...'
                          : isEnrolled
                            ? '✓ Enrolled'
                            : atCapacity
                              ? 'Slots Full (2/2)'
                              : 'Register Course'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
