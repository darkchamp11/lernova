import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { progress } from '@/src/db/schema';
import { deleteCachedData } from '@/src/lib/redis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userProgress = await db
      .select()
      .from(progress)
      .where(eq(progress.userId, Number(userId)));

    return NextResponse.json({ progress: userProgress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, contentId, score, timeSpent, completed } = body;

    if (!userId || !contentId) {
      return NextResponse.json({ error: 'userId and contentId are required' }, { status: 400 });
    }

    // Check if progress already exists
    const existingProgress = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.contentId, contentId)))
      .limit(1);

    let result: typeof existingProgress;

    if (existingProgress.length > 0) {
      // Update existing progress
      result = await db
        .update(progress)
        .set({
          score: score ?? existingProgress[0].score,
          timeSpent: timeSpent ?? existingProgress[0].timeSpent,
          completed: completed ?? existingProgress[0].completed,
          updatedAt: new Date(),
        })
        .where(eq(progress.id, existingProgress[0].id))
        .returning();
    } else {
      // Create new progress
      result = await db
        .insert(progress)
        .values({
          userId,
          contentId,
          score: score ?? 0,
          timeSpent: timeSpent ?? 0,
          completed: completed ?? 0,
        })
        .returning();
    }

    // Invalidate recommendation cache for this user
    await deleteCachedData(`recommend:${userId}`);

    return NextResponse.json({ progress: result[0] });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
