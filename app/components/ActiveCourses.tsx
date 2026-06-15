'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TodoItem {
  id: number;
  enrollmentId: number;
  title: string;
  completed: number;
  isCustom: number;
  sortOrder: number;
}

interface CourseInfo {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  description: string | null;
}

interface EnrollmentInfo {
  id: number;
  userId: number;
  contentId: number;
  status: string;
  quizScore: number | null;
}

interface EnrollmentWithDetails {
  enrollment: EnrollmentInfo;
  course: CourseInfo;
  todos: TodoItem[];
}

interface ActiveCoursesProps {
  userId: number;
  onEnrollmentChange?: () => void;
}

export default function ActiveCourses({ userId, onEnrollmentChange }: ActiveCoursesProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<number, string>>({});
  const [addingTask, setAddingTask] = useState<Record<number, boolean>>({});
  const router = useRouter();

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await fetch(`/api/enrollments?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleToggleTodo = async (todoId: number, currentCompleted: number) => {
    // Optimistic update
    setEnrollments((prev) =>
      prev.map((e) => ({
        ...e,
        todos: e.todos.map((t) =>
          t.id === todoId ? { ...t, completed: currentCompleted ? 0 : 1 } : t
        ),
      }))
    );

    try {
      const res = await fetch('/api/enrollments/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoId, completed: !currentCompleted }),
      });

      if (!res.ok) {
        // Revert on failure
        setEnrollments((prev) =>
          prev.map((e) => ({
            ...e,
            todos: e.todos.map((t) =>
              t.id === todoId ? { ...t, completed: currentCompleted } : t
            ),
          }))
        );
      }
    } catch {
      // Revert
      setEnrollments((prev) =>
        prev.map((e) => ({
          ...e,
          todos: e.todos.map((t) => (t.id === todoId ? { ...t, completed: currentCompleted } : t)),
        }))
      );
    }
  };

  const handleAddTask = async (enrollmentId: number) => {
    const title = newTaskInputs[enrollmentId]?.trim();
    if (!title || title.length < 3) return;

    setAddingTask((prev) => ({ ...prev, [enrollmentId]: true }));

    try {
      const res = await fetch('/api/enrollments/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, title }),
      });

      if (res.ok) {
        const data = await res.json();
        setEnrollments((prev) =>
          prev.map((e) =>
            e.enrollment.id === enrollmentId ? { ...e, todos: [...e.todos, data.todo] } : e
          )
        );
        setNewTaskInputs((prev) => ({ ...prev, [enrollmentId]: '' }));
      }
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setAddingTask((prev) => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const handleDeleteTask = async (todoId: number, enrollmentId: number) => {
    try {
      const res = await fetch(`/api/enrollments/todos?todoId=${todoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEnrollments((prev) =>
          prev.map((e) =>
            e.enrollment.id === enrollmentId
              ? { ...e, todos: e.todos.filter((t) => t.id !== todoId) }
              : e
          )
        );
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleTakeQuiz = (courseId: number, enrollmentId: number) => {
    router.push(`/course/${courseId}/quiz?enrollmentId=${enrollmentId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-dashed border-gray-300 p-8 text-center">
        <div className="text-4xl mb-3">📚</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No Active Courses</h3>
        <p className="text-gray-500 text-sm">
          Register for a course below to start your personalized study plan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {enrollments.map(({ enrollment, course, todos }) => {
        const completedCount = todos.filter((t) => t.completed === 1).length;
        const totalCount = todos.length;
        const allDone = totalCount > 0 && completedCount === totalCount;
        const progressPercent =
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return (
          <div
            key={enrollment.id}
            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg leading-tight">{course.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded">
                      {course.topic}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        course.difficulty === 'beginner'
                          ? 'bg-emerald-400/30 text-emerald-100'
                          : course.difficulty === 'intermediate'
                            ? 'bg-amber-400/30 text-amber-100'
                            : 'bg-red-400/30 text-red-100'
                      }`}
                    >
                      {course.difficulty}
                    </span>
                  </div>
                </div>
                {enrollment.quizScore !== null && (
                  <div className="bg-white/20 rounded-lg px-3 py-1.5 text-center">
                    <p className="text-white/70 text-[10px] uppercase tracking-wider">Last Score</p>
                    <p
                      className={`text-lg font-bold ${enrollment.quizScore >= 75 ? 'text-emerald-200' : 'text-red-200'}`}
                    >
                      {enrollment.quizScore}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-5 pt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500 font-medium">Study Progress</span>
                <span className="font-bold text-gray-700">
                  {completedCount}/{totalCount} tasks
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    allDone
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      : 'bg-gradient-to-r from-indigo-400 to-purple-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* To-Do List */}
            <div className="px-5 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Study Plan
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-2.5 group rounded-lg px-2 py-1.5 transition-colors ${
                      todo.completed ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(todo.id, todo.completed)}
                      className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        todo.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      {todo.completed === 1 && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}
                    >
                      {todo.title}
                    </span>
                    {todo.isCustom === 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(todo.id, enrollment.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity"
                        title="Remove custom task"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Custom Task */}
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newTaskInputs[enrollment.id] || ''}
                  onChange={(e) =>
                    setNewTaskInputs((prev) => ({ ...prev, [enrollment.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask(enrollment.id);
                  }}
                  placeholder="Add a custom task..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none placeholder-gray-400"
                  disabled={addingTask[enrollment.id]}
                />
                <button
                  type="button"
                  onClick={() => handleAddTask(enrollment.id)}
                  disabled={
                    addingTask[enrollment.id] ||
                    (newTaskInputs[enrollment.id]?.trim().length ?? 0) < 3
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {addingTask[enrollment.id] ? '...' : '+'}
                </button>
              </div>
            </div>

            {/* Take Quiz Button */}
            <div className="px-5 pb-4 pt-2">
              {allDone ? (
                <button
                  type="button"
                  onClick={() => handleTakeQuiz(course.id, enrollment.id)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  🎯 Take Final Quiz
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full bg-gray-200 text-gray-500 font-semibold py-2.5 px-4 rounded-lg cursor-not-allowed text-sm"
                >
                  Complete all tasks to unlock quiz ({totalCount - completedCount} remaining)
                </button>
              )}

              {enrollment.quizScore !== null && enrollment.quizScore < 75 && (
                <p className="text-center text-xs text-amber-600 mt-2 font-medium">
                  ⚠️ You need ≥75% to pass. Keep studying and retry!
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Slot indicator */}
      {enrollments.length === 2 && (
        <div className="lg:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-700 text-sm font-medium">
            ⚠️ Both course slots are full. Pass a quiz (≥75%) to free a slot for new registrations.
          </p>
        </div>
      )}
    </div>
  );
}
