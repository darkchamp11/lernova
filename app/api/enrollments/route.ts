import { and, eq, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { content, enrollments, enrollmentTodos } from '@/src/db/schema';
import { generateAIJSON } from '@/src/lib/ai-provider';
import { deleteCachedData } from '@/src/lib/redis';

interface TodoTask {
  title: string;
}

/**
 * GET — Fetch a user's active enrollments with course details and to-do items.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const numericUserId = Number(userId);
    if (Number.isNaN(numericUserId)) {
      return NextResponse.json({ error: 'userId must be a number' }, { status: 400 });
    }

    // Fetch active enrollments with course details
    const activeEnrollments = await db
      .select({
        enrollment: enrollments,
        course: content,
      })
      .from(enrollments)
      .innerJoin(content, eq(enrollments.contentId, content.id))
      .where(
        and(
          eq(enrollments.userId, numericUserId),
          eq(enrollments.status, 'active'),
        ),
      )
      .orderBy(enrollments.createdAt);

    // Fetch todos for each enrollment
    const enriched = await Promise.all(
      activeEnrollments.map(async ({ enrollment, course }) => {
        const todos = await db
          .select()
          .from(enrollmentTodos)
          .where(eq(enrollmentTodos.enrollmentId, enrollment.id))
          .orderBy(asc(enrollmentTodos.sortOrder), asc(enrollmentTodos.createdAt));

        return { enrollment, course, todos };
      }),
    );

    return NextResponse.json({ enrollments: enriched });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

/**
 * POST — Register for a course. Generates AI study tasks.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, contentId } = body;

    if (!userId || !contentId) {
      return NextResponse.json(
        { error: 'userId and contentId are required' },
        { status: 400 },
      );
    }

    // Check max 2 active enrollments
    const activeCount = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.status, 'active'),
        ),
      );

    if (activeCount.length >= 2) {
      return NextResponse.json(
        { error: 'You can only have 2 active courses at a time. Complete or pass a course to free a slot.' },
        { status: 403 },
      );
    }

    // Check duplicate enrollment
    const existing = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.contentId, contentId),
          eq(enrollments.status, 'active'),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You are already enrolled in this course.' },
        { status: 409 },
      );
    }

    // Fetch course details for AI prompt
    const courseData = await db
      .select()
      .from(content)
      .where(eq(content.id, contentId))
      .limit(1);

    if (courseData.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courseData[0];

    // Insert enrollment
    const [newEnrollment] = await db
      .insert(enrollments)
      .values({ userId, contentId, status: 'active' })
      .returning();

    // Generate AI study tasks
    let tasks: TodoTask[] = [];
    try {
      const prompt = `Create a study plan for a student enrolling in a course.

Course: "${course.title}"
Topic: ${course.topic}
Difficulty: ${course.difficulty}
Description: ${course.description || 'N/A'}
Keywords: ${(course.keywords || []).join(', ')}

Generate exactly 5 study tasks that form a logical learning progression for this course. Each task should be a specific, actionable learning objective.

Respond with valid JSON only:
{ "tasks": [ { "title": "Task description here" } ] }

Requirements:
- Tasks should progress from foundational to advanced
- Each task should be specific and actionable (e.g., "Learn the basics of CSS Grid layout" not "Study CSS")
- Tasks should cover the key topics the student needs to master
- Keep each task title under 100 characters`;

      const { data } = await generateAIJSON<{ tasks: TodoTask[] }>(prompt, {
        temperature: 0.6,
        maxTokens: 512,
        systemPrompt: 'You are an expert curriculum designer. Respond in valid JSON only.',
      });

      tasks = data.tasks || [];
    } catch (err) {
      console.error('AI task generation failed, using defaults:', err);
      // Fallback: generic tasks
      tasks = [
        { title: `Read and understand the fundamentals of ${course.topic}` },
        { title: `Practice basic exercises in ${course.topic}` },
        { title: `Study the key concepts: ${(course.keywords || []).slice(0, 3).join(', ')}` },
        { title: `Work through intermediate examples and problems` },
        { title: `Review and consolidate your understanding` },
      ];
    }

    // Insert todos
    if (tasks.length > 0) {
      await db.insert(enrollmentTodos).values(
        tasks.map((task, index) => ({
          enrollmentId: newEnrollment.id,
          title: task.title,
          completed: 0,
          isCustom: 0,
          sortOrder: index,
        })),
      );
    }

    // Fetch the created todos
    const todos = await db
      .select()
      .from(enrollmentTodos)
      .where(eq(enrollmentTodos.enrollmentId, newEnrollment.id))
      .orderBy(asc(enrollmentTodos.sortOrder));

    // Invalidate recommendation cache
    await deleteCachedData(`recommend:${userId}`);

    return NextResponse.json({
      enrollment: newEnrollment,
      course,
      todos,
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: 'Failed to register for course' }, { status: 500 });
  }
}
