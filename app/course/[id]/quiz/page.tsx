'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type: 'mcq';
}

interface WrittenQuestion {
  question: string;
  explanation: string;
  type: 'written';
}

type QuizQuestion = MCQQuestion | WrittenQuestion;

interface MCQFeedback {
  questionIndex: number;
  correct: boolean;
  explanation: string;
}

interface WrittenFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
}

interface AnalysisResult {
  overallScore: number;
  mcqFeedback: MCQFeedback[];
  writtenFeedback: WrittenFeedback;
}

interface CourseInfo {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
}

interface TodoItem {
  id: number;
  title: string;
  completed: number;
}

interface EnrollmentData {
  enrollment: { id: number; status: string; quizScore: number | null };
  course: CourseInfo;
  todos: TodoItem[];
}

const PASS_THRESHOLD = 75;

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const enrollmentId = searchParams.get('enrollmentId')
    ? Number(searchParams.get('enrollmentId'))
    : null;

  // Course info
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [todoTitles, setTodoTitles] = useState<string[]>([]);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [writtenAnswer, setWrittenAnswer] = useState('');

  // UI state
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Feedback state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);

  // Session
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUserId(data.user.userId);
          }
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    };
    fetchSession();
  }, []);

  // Fetch course details, enrollment todos, then generate quiz
  useEffect(() => {
    const loadQuiz = async () => {
      setIsLoadingQuiz(true);
      setQuizError(null);

      try {
        // 1. Get course info
        const courseRes = await fetch(`/api/course/${courseId}`);
        if (!courseRes.ok) throw new Error('Could not load course details');
        const courseData = await courseRes.json();
        setCourse(courseData.course);

        // 2. If enrolled, fetch todo titles for targeted quiz
        let todos: string[] = [];
        if (enrollmentId && userId) {
          try {
            const enrollRes = await fetch(`/api/enrollments?userId=${userId}`);
            if (enrollRes.ok) {
              const enrollData = await enrollRes.json();
              const myEnrollment = (enrollData.enrollments || []).find(
                (e: EnrollmentData) => e.enrollment.id === enrollmentId
              );
              if (myEnrollment) {
                todos = myEnrollment.todos.map((t: TodoItem) => t.title);
                setTodoTitles(todos);
              }
            }
          } catch {
            // Non-critical — quiz will be generated without todos
          }
        }

        // 3. Generate quiz questions
        const quizRes = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: courseData.course.topic,
            difficulty: courseData.course.difficulty,
            count: 4,
            ...(todos.length > 0 ? { todos } : {}),
          }),
        });

        if (!quizRes.ok) {
          const errData = await quizRes.json();
          throw new Error(errData.error || 'Failed to generate quiz');
        }

        const quizData = await quizRes.json();
        setQuestions(quizData.questions);
      } catch (err) {
        setQuizError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    // Wait for userId to be set before loading (needed for enrollment lookup)
    if (userId !== null || !enrollmentId) {
      loadQuiz();
    }
  }, [courseId, enrollmentId, userId]);

  const mcqQuestions = questions.filter((q): q is MCQQuestion => q.type === 'mcq');
  const writtenQuestion = questions.find((q): q is WrittenQuestion => q.type === 'written');

  const handleSelectOption = (questionIndex: number, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const allAnswered =
    Object.keys(answers).length >= mcqQuestions.length &&
    (writtenQuestion ? writtenAnswer.trim().length > 0 : true);

  const handleSubmit = async () => {
    if (!allAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitted(true);

    // Calculate basic MCQ score
    let mcqCorrect = 0;
    for (let i = 0; i < mcqQuestions.length; i++) {
      if (answers[i] === mcqQuestions[i].correctAnswer) {
        mcqCorrect++;
      }
    }

    // Build data for AI analysis
    const mcqAnswersPayload = mcqQuestions.map((q, i) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      selectedAnswer: answers[i] || '',
    }));

    const writtenPayload = {
      question: writtenQuestion?.question || '',
      answer: writtenAnswer,
    };

    // Start AI analysis
    setIsAnalyzing(true);
    try {
      const analyzeRes = await fetch('/api/analyze-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: course?.topic || 'General',
          difficulty: course?.difficulty || 'intermediate',
          mcqAnswers: mcqAnswersPayload,
          writtenAnswer: writtenPayload,
        }),
      });

      let finalScore: number;

      if (analyzeRes.ok) {
        const analysisData: AnalysisResult = await analyzeRes.json();
        setAnalysis(analysisData);
        finalScore = analysisData.overallScore;
      } else {
        // Fallback: MCQ-only score
        finalScore = Math.round((mcqCorrect / mcqQuestions.length) * 100);
        setAnalysis({
          overallScore: finalScore,
          mcqFeedback: mcqQuestions.map((q, i) => ({
            questionIndex: i,
            correct: answers[i] === q.correctAnswer,
            explanation: q.explanation,
          })),
          writtenFeedback: {
            score: 0,
            feedback: 'AI analysis was unavailable. Your written answer was not scored.',
            suggestions: [],
          },
        });
      }

      // Determine pass/fail
      const didPass = finalScore >= PASS_THRESHOLD;
      setPassed(didPass);

      // Save progress — completed only if passed
      if (userId) {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            contentId: courseId,
            score: finalScore,
            timeSpent: 10,
            completed: didPass ? 1 : 0,
          }),
        });
      }

      // Update enrollment status via mastery gate
      if (enrollmentId) {
        try {
          await fetch('/api/enrollments/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enrollmentId, score: finalScore }),
          });
        } catch (err) {
          console.error('Error updating enrollment:', err);
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const fallbackScore = Math.round((mcqCorrect / mcqQuestions.length) * 100);
      const didPass = fallbackScore >= PASS_THRESHOLD;
      setPassed(didPass);
      setAnalysis({
        overallScore: fallbackScore,
        mcqFeedback: mcqQuestions.map((q, i) => ({
          questionIndex: i,
          correct: answers[i] === q.correctAnswer,
          explanation: q.explanation,
        })),
        writtenFeedback: {
          score: 0,
          feedback: 'Could not connect to the AI analysis service.',
          suggestions: [],
        },
      });
    } finally {
      setIsAnalyzing(false);
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setQuestions([]);
    setAnswers({});
    setWrittenAnswer('');
    setSubmitted(false);
    setAnalysis(null);
    setPassed(null);
    setIsLoadingQuiz(true);
    setQuizError(null);

    const regenerate = async () => {
      try {
        const quizRes = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: course?.topic || 'Programming',
            difficulty: course?.difficulty || 'intermediate',
            count: 4,
            ...(todoTitles.length > 0 ? { todos: todoTitles } : {}),
          }),
        });
        if (!quizRes.ok) throw new Error('Failed to regenerate quiz');
        const quizData = await quizRes.json();
        setQuestions(quizData.questions);
      } catch (err) {
        setQuizError(err instanceof Error ? err.message : 'Failed to regenerate');
      } finally {
        setIsLoadingQuiz(false);
      }
    };
    regenerate();
  };

  // ─── Loading state ───────────────────────────────────────────────────
  if (isLoadingQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Generating Your Quiz...</h2>
          <p className="text-gray-500">
            {todoTitles.length > 0
              ? 'Creating questions based on your study plan'
              : 'AI is creating unique questions tailored to your level'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────
  if (quizError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Quiz Generation Failed</h2>
            <p className="text-gray-600 mb-6">{quizError}</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-xl border-2 border-gray-200 transition-all duration-200"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main quiz ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm mb-4 inline-flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{course?.title || 'Quiz'}</h1>
          <p className="text-gray-500 mt-2">
            {submitted
              ? 'Review your results and AI feedback below'
              : `Answer all ${questions.length} questions, then submit to get AI-powered feedback.`}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {course && (
              <>
                <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-sm font-medium">
                  {course.topic}
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${
                    course.difficulty === 'beginner'
                      ? 'bg-emerald-100 text-emerald-800'
                      : course.difficulty === 'intermediate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {course.difficulty}
                </span>
              </>
            )}
            {enrollmentId && (
              <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-sm font-medium">
                📋 Enrollment Quiz • Pass ≥{PASS_THRESHOLD}%
              </span>
            )}
          </div>
        </div>

        {/* MCQ Questions */}
        <div className="space-y-6">
          {mcqQuestions.map((q, qIndex) => {
            const selectedOption = answers[qIndex];
            const feedback = analysis?.mcqFeedback?.find((f) => f.questionIndex === qIndex);
            const isCorrectAnswer = submitted && feedback?.correct;
            const isWrongAnswer = submitted && feedback && !feedback.correct;

            return (
              <div
                key={`mcq-${qIndex}`}
                className={`bg-white rounded-xl shadow-md border-2 p-6 transition-all duration-300 ${
                  submitted
                    ? isCorrectAnswer
                      ? 'border-emerald-300'
                      : isWrongAnswer
                        ? 'border-red-300'
                        : 'border-gray-100'
                    : 'border-gray-100'
                }`}
              >
                <p className="font-semibold text-gray-800 mb-4">
                  <span className="text-indigo-600 mr-2">Q{qIndex + 1}.</span>
                  {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((option) => {
                    let optionStyle =
                      'bg-gray-50 hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 text-gray-700 cursor-pointer';

                    if (selectedOption === option && !submitted) {
                      optionStyle = 'bg-indigo-100 border-indigo-500 text-indigo-800';
                    }

                    if (submitted) {
                      if (option === q.correctAnswer) {
                        optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800';
                      } else if (option === selectedOption && option !== q.correctAnswer) {
                        optionStyle = 'bg-red-50 border-red-500 text-red-800';
                      } else {
                        optionStyle = 'bg-gray-50 border-gray-200 text-gray-400';
                      }
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelectOption(qIndex, option)}
                        disabled={submitted}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${optionStyle} ${
                          submitted ? 'cursor-default' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {submitted && option === q.correctAnswer && (
                            <span className="text-emerald-600">✓</span>
                          )}
                          {submitted && option === selectedOption && option !== q.correctAnswer && (
                            <span className="text-red-600">✗</span>
                          )}
                          {option}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Per-question AI feedback */}
                {submitted && feedback && (
                  <div
                    className={`mt-4 rounded-lg p-4 border ${
                      feedback.correct
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <p
                      className={`font-semibold text-sm mb-1 ${
                        feedback.correct ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {feedback.correct ? '✓ Correct' : '✗ Incorrect'}
                    </p>
                    <p className="text-gray-700 text-sm">{feedback.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Written Answer Question */}
          {writtenQuestion && (
            <div
              className={`bg-white rounded-xl shadow-md border-2 p-6 transition-all duration-300 ${
                submitted && analysis?.writtenFeedback
                  ? analysis.writtenFeedback.score >= 70
                    ? 'border-emerald-300'
                    : 'border-amber-300'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-xs font-semibold">
                  Written Answer
                </span>
              </div>
              <p className="font-semibold text-gray-800 mb-4">
                <span className="text-indigo-600 mr-2">Q{mcqQuestions.length + 1}.</span>
                {writtenQuestion.question}
              </p>

              <textarea
                value={writtenAnswer}
                onChange={(e) => setWrittenAnswer(e.target.value)}
                disabled={submitted}
                placeholder="Write your answer here..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-gray-700 text-sm resize-none transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-600"
              />

              {/* Written answer AI feedback */}
              {submitted && analysis?.writtenFeedback && (
                <div className="mt-4 space-y-3">
                  <div
                    className={`rounded-lg p-4 border ${
                      analysis.writtenFeedback.score >= 70
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className={`font-semibold text-sm ${
                          analysis.writtenFeedback.score >= 70
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        Written Answer Score: {analysis.writtenFeedback.score}%
                      </p>
                    </div>
                    <p className="text-gray-700 text-sm">{analysis.writtenFeedback.feedback}</p>
                  </div>

                  {analysis.writtenFeedback.suggestions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-700 font-semibold text-sm mb-2">
                        💡 Suggestions for improvement:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.writtenFeedback.suggestions.map((s, i) => (
                          <li key={`suggestion-${i}`} className="text-blue-800 text-sm">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit / Result / Analyzing */}
        <div className="mt-8 text-center">
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !allAnswered}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-10 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : isAnalyzing ? (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-indigo-100 inline-block">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-700 font-semibold">AI is analyzing your answers...</p>
              <p className="text-gray-500 text-sm mt-1">Generating personalized feedback</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Overall score card */}
              <div
                className={`bg-white rounded-xl shadow-lg p-8 border-2 inline-block ${
                  passed === true
                    ? 'border-emerald-200'
                    : passed === false
                      ? 'border-red-200'
                      : 'border-gray-100'
                }`}
              >
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Overall Score</p>
                <p className="text-5xl font-bold mb-2">
                  <span
                    className={
                      analysis.overallScore >= PASS_THRESHOLD
                        ? 'text-emerald-600'
                        : analysis.overallScore >= 50
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }
                  >
                    {analysis.overallScore}%
                  </span>
                </p>

                {/* Enrollment-specific pass/fail message */}
                {enrollmentId ? (
                  <div
                    className={`mt-3 px-4 py-2 rounded-lg ${
                      passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <p className="font-semibold text-sm">
                      {passed
                        ? '🎉 Congratulations! You passed! Course slot is now free.'
                        : `❌ You need ≥${PASS_THRESHOLD}% to pass. Review your study plan and retry.`}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    {analysis.overallScore >= 80
                      ? '🎉 Excellent work!'
                      : analysis.overallScore >= 50
                        ? '👍 Good effort — keep practicing!'
                        : '📚 Review the material and try again.'}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-4">
                {(!enrollmentId || !passed) && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                  >
                    🔄 Retake Quiz
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-8 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  ← Dashboard
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
