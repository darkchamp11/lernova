'use client';

import { useParams, useRouter } from 'next/navigation';

export default function AdvancedPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-10 text-center">
          {/* Trophy icon */}
          <div className="text-7xl mb-6">🎉</div>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Perfect Score!
          </h1>

          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-lg mb-6">
            <span>💯</span> 100%
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Outstanding work! You&apos;ve demonstrated an excellent understanding of
            the material. You&apos;re ready to move on to more advanced topics.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              🚀 Explore Advanced Courses
            </button>
            <button
              type="button"
              onClick={() => router.push(`/course/${courseId}/quiz`)}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
