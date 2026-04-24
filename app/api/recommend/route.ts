import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { content } from '@/src/db/schema';
import { getCachedData, setCachedData } from '@/src/lib/redis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const cacheKey = `recommend:${userId}`;

    // Check cache first
    const cachedRecommendations = await getCachedData<typeof recommendations>(cacheKey);
    if (cachedRecommendations) {
      return NextResponse.json({
        recommendations: cachedRecommendations,
        source: 'cache',
      });
    }

    // Fetch random recommendations (placeholder logic for Phase 1)
    // In Phase 2, this will call the ML service
    const recommendations = await db.select().from(content).orderBy(sql`RANDOM()`).limit(5);

    // Cache recommendations for 1 hour
    await setCachedData(cacheKey, recommendations, 3600);

    return NextResponse.json({
      recommendations,
      source: 'database',
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

// Placeholder for future ML integration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    // TODO: Phase 2 - Call FastAPI ML service here
    // const mlRecommendations = await fetch('http://ml-service:8000/recommend', {
    //   method: 'POST',
    //   body: JSON.stringify({ userId, preferences }),
    // });

    return NextResponse.json({
      message: 'ML-based recommendations will be available in Phase 2',
      userId,
      preferences,
    });
  } catch (error) {
    console.error('Error in ML recommendations:', error);
    return NextResponse.json({ error: 'Failed to get ML recommendations' }, { status: 500 });
  }
}
