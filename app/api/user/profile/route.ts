import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { content, progress, users } from '@/src/db/schema';

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

    // Fetch user data
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        knowledgeVec: users.knowledgeVec,
        goal: users.goal,
      })
      .from(users)
      .where(eq(users.id, numericUserId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch recent progress entries with content details
    const recentProgress = await db
      .select({
        id: progress.id,
        score: progress.score,
        timeSpent: progress.timeSpent,
        completed: progress.completed,
        createdAt: progress.createdAt,
        contentTitle: content.title,
        contentTopic: content.topic,
      })
      .from(progress)
      .innerJoin(content, eq(progress.contentId, content.id))
      .where(eq(progress.userId, numericUserId))
      .orderBy(desc(progress.createdAt))
      .limit(5);

    return NextResponse.json({
      user: user[0],
      recentProgress,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
