import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { content, progress, users } from '@/src/db/schema';
import { deleteCachedData } from '@/src/lib/redis';

// Maps course topics to knowledgeVec dimension indices
const TOPIC_TO_DIMENSION: Record<string, number> = {
  'Programming': 0,
  'Web Development': 1,
  'Backend Development': 1,
  'Computer Science': 2,
  'Software Engineering': 2,
  'AI & ML': 3,
  'Emerging Tech': 3,
  'DevOps': 4,
  'Cloud': 4,
  'Databases': 2,
  'Tools': 4,
};

function getTopicDimension(topic: string): number {
  return TOPIC_TO_DIMENSION[topic] ?? 0; // Default to Programming
}

/**
 * Recalculates the user's knowledgeVec based on all their progress records.
 * Each dimension represents a topic area, and its value (0–1) is the average
 * score across completed courses in that area.
 */
async function updateKnowledgeProfile(userId: number): Promise<void> {
  // Get all progress entries with course topics
  const progressWithTopics = await db
    .select({
      score: progress.score,
      completed: progress.completed,
      topic: content.topic,
    })
    .from(progress)
    .innerJoin(content, eq(progress.contentId, content.id))
    .where(eq(progress.userId, userId));

  if (progressWithTopics.length === 0) return;

  // Group scores by dimension
  const dimensionScores: number[][] = [[], [], [], [], []]; // 5 dimensions

  for (const entry of progressWithTopics) {
    if (entry.score !== null && entry.score >= 50) {
      const dim = getTopicDimension(entry.topic);
      dimensionScores[dim].push(entry.score);
    }
  }

  // Calculate average for each dimension
  const knowledgeVec = dimensionScores.map((scores) => {
    if (scores.length === 0) return 0;
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.round((avg / 100) * 100) / 100; // Normalize to 0–1, 2 decimal places
  });

  // Update the user's knowledge vector
  await db
    .update(users)
    .set({ knowledgeVec, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

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

    // Update the user's knowledge profile after any progress change
    try {
      await updateKnowledgeProfile(userId);
    } catch (err) {
      console.error('Error updating knowledge profile:', err);
      // Don't fail the request — profile update is best-effort
    }

    // Invalidate recommendation cache for this user
    await deleteCachedData(`recommend:${userId}`);

    return NextResponse.json({ progress: result[0] });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
