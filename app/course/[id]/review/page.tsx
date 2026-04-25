'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id;
  const score = searchParams.get('score') || '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-10 text-center">
          {/* Book icon */}
          <div className="text-7xl mb-6">📝</div>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Keep Practicing!
          </h1>

          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-bold text-lg mb-6">
            <span>📊</span> {score}%
          </div>

          <p className="text-gray-600 mb-4 leading-relaxed">
            Good effort! Review the material and try again to improve your score.
            Every attempt brings you closer to mastery.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <p className="text-amber-800 text-sm font-medium">
              💡 Tip: Focus on the questions you got wrong and revisit the related concepts before retrying.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push(`/course/${courseId}/quiz`)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              🔄 Retry Quiz
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
