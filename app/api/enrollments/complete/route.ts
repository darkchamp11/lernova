import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { enrollments } from '@/src/db/schema';

const PASS_THRESHOLD = 75;

/**
 * POST — Update enrollment status based on quiz score (mastery gate).
 * Score >= 75: status → 'passed'
 * Score < 75:  status stays 'active', quizScore updated
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enrollmentId, score } = body;

    if (enrollmentId === undefined || score === undefined) {
      return NextResponse.json(
        { error: 'enrollmentId and score are required' },
        { status: 400 },
      );
    }

    // Verify enrollment exists and is active
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .limit(1);

    if (enrollment.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment[0].status !== 'active') {
      return NextResponse.json(
        { error: 'This enrollment is already completed' },
        { status: 400 },
      );
    }

    const passed = score >= PASS_THRESHOLD;

    const [updated] = await db
      .update(enrollments)
      .set({
        status: passed ? 'passed' : 'active',
        quizScore: score,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, enrollmentId))
      .returning();

    return NextResponse.json({
      enrollment: updated,
      passed,
      message: passed
        ? `Congratulations! You passed with ${score}%. The course slot is now free.`
        : `You scored ${score}%. You need at least ${PASS_THRESHOLD}% to pass. Keep studying and try again!`,
    });
  } catch (error) {
    console.error('Error completing enrollment:', error);
    return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 });
  }
}
