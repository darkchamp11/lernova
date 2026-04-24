import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-white">
          <h1 className="text-6xl font-bold mb-6 text-center">
            Personalized Smart Learning Platform
          </h1>
          <p className="text-xl mb-8 text-center max-w-2xl opacity-90">
            Welcome to Phase 1 - Your intelligent learning companion powered by Next.js, Drizzle
            ORM, PostgreSQL, and Redis.
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="/auth"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Login / Register
            </Link>
            <Link
              href="/dashboard"
              className="bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-800 transition-colors shadow-lg border-2 border-white/30"
            >
              Go to Dashboard
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">🎯 Smart Recommendations</h3>
              <p className="opacity-90">
                Get personalized course recommendations based on your learning patterns and
                preferences.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">⚡ Lightning Fast</h3>
              <p className="opacity-90">
                Redis caching ensures blazing-fast response times for all your learning data.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">📊 Track Progress</h3>
              <p className="opacity-90">
                Monitor your learning journey with comprehensive progress tracking and analytics.
              </p>
            </div>
          </div>

          <div className="mt-12 text-sm opacity-75">
            <p>Phase 1 includes: Session Management • Database Models • Caching • API Routes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
