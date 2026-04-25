'use client';

import { useState } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface RealTimeQuizProps {
  topic: string;
  difficulty: string;
}

export default function RealTimeQuiz({ topic, difficulty }: RealTimeQuizProps) {
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateQuiz = async () => {
    setIsLoading(true);
    setQuiz(null);
    setSelectedAnswer(null);
    setError(null);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate quiz');
      }

      const data: QuizQuestion = await response.json();
      setQuiz(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (selectedAnswer) return; // already answered
    setSelectedAnswer(option);
  };

  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === quiz?.correctAnswer;

  const getOptionStyle = (option: string): string => {
    if (!isAnswered) {
      return 'bg-white hover:bg-indigo-50 border-gray-200 hover:border-indigo-400 text-gray-800 cursor-pointer';
    }

    if (option === quiz?.correctAnswer) {
      return 'bg-emerald-50 border-emerald-500 text-emerald-800';
    }

    if (option === selectedAnswer && option !== quiz?.correctAnswer) {
      return 'bg-red-50 border-red-500 text-red-800';
    }

    return 'bg-gray-50 border-gray-200 text-gray-400';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h3 className="text-lg font-bold text-white">Real-Time Knowledge Check</h3>
        </div>
        <p className="text-violet-100 text-sm mt-1">
          AI-generated questions about <span className="font-semibold">{topic}</span> · {difficulty}
        </p>
      </div>

      <div className="p-6">
        {/* Initial state — Generate button */}
        {!quiz && !isLoading && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Test your knowledge with an AI-generated question tailored to your level.
            </p>
            <button
              type="button"
              onClick={generateQuiz}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              🧠 Generate Quick Knowledge Check
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="py-8 space-y-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="space-y-3 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
            <p className="text-center text-gray-400 text-sm mt-4">
              AI is generating your question...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="py-6 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              type="button"
              onClick={generateQuiz}
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Quiz question */}
        {quiz && (
          <div className="space-y-5">
            {/* Question */}
            <p className="text-gray-800 font-medium text-lg leading-relaxed">
              {quiz.question}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {quiz.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelectAnswer(option)}
                  disabled={isAnswered}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 ${getOptionStyle(option)} ${
                    isAnswered ? 'cursor-default' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isAnswered && option === quiz.correctAnswer && (
                      <span className="text-emerald-600 text-lg">✓</span>
                    )}
                    {isAnswered && option === selectedAnswer && option !== quiz.correctAnswer && (
                      <span className="text-red-600 text-lg">✗</span>
                    )}
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Result feedback */}
            {isAnswered && (
              <div
                className={`rounded-lg p-4 border ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <p
                  className={`font-semibold mb-1 ${
                    isCorrect ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isCorrect ? '🎉 Correct!' : '💡 Not quite!'}
                </p>
                <p className="text-gray-700 text-sm">{quiz.explanation}</p>
              </div>
            )}

            {/* Generate another */}
            {isAnswered && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={generateQuiz}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  Generate Another Question →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
