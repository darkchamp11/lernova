import { and, desc, eq, notInArray, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { content, progress, users } from '@/src/db/schema';
import { getCachedData, setCachedData } from '@/src/lib/redis';
import { generateAIJSON } from '@/src/lib/ai-provider';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface RecommendationResponse {
  recommendations: (typeof content.$inferSelect)[];
  targetDifficulty: Difficulty;
  averageScore: number;
  source: 'cache' | 'database';
  goal: string | null;
}

/**
 * Maps an average score to a target difficulty level.
 *   >= 80 → advanced
 *   >= 50 → intermediate
 *   < 50  → beginner
 */
function scoreToDifficulty(avgScore: number): Difficulty {
  if (avgScore >= 80) return 'advanced';
  if (avgScore >= 50) return 'intermediate';
  return 'beginner';
}

/**
 * Uses AI to extract topic keywords from a learning goal.
 * Falls back to basic keyword extraction if AI is unavailable.
 */
async function extractGoalTopics(goal: string): Promise<string[]> {
  try {
    const prompt = `Extract the key learning topic keywords from this learning goal. Map them to these available course topics: "Programming", "Web Development", "Backend Development", "Computer Science", "Software Engineering", "AI & ML", "DevOps", "Cloud", "Databases", "Tools", "Emerging Tech".

Goal: "${goal}"

Respond with valid JSON only:
{ "topics": ["topic1", "topic2"] }

Return only topics from the list above that are relevant to the goal. Return at most 5 topics.`;

    const { data } = await generateAIJSON<{ topics: string[] }>(prompt, {
      temperature: 0.2,
      maxTokens: 256,
    });

    return data.topics || [];
  } catch (err) {
    console.warn('Could not extract goal topics via AI:', (err as Error).message);

    // Basic keyword matching fallback
    const goalLower = goal.toLowerCase();
    const topicMap: Record<string, string> = {
      web: 'Web Development',
      frontend: 'Web Development',
      react: 'Web Development',
      next: 'Web Development',
      css: 'Web Development',
      html: 'Web Development',
      backend: 'Backend Development',
      api: 'Backend Development',
      rest: 'Backend Development',
      python: 'Programming',
      javascript: 'Programming',
      typescript: 'Programming',
      java: 'Programming',
      programming: 'Programming',
      code: 'Programming',
      coding: 'Programming',
      algorithm: 'Computer Science',
      'data structure': 'Computer Science',
      'system design': 'Software Engineering',
      software: 'Software Engineering',
      'machine learning': 'AI & ML',
      ai: 'AI & ML',
      'artificial intelligence': 'AI & ML',
      'deep learning': 'AI & ML',
      neural: 'AI & ML',
      ml: 'AI & ML',
      docker: 'DevOps',
      kubernetes: 'DevOps',
      devops: 'DevOps',
      'ci/cd': 'DevOps',
      cloud: 'Cloud',
      aws: 'Cloud',
      azure: 'Cloud',
      database: 'Databases',
      sql: 'Databases',
      postgres: 'Databases',
      redis: 'Databases',
      mongodb: 'Databases',
      git: 'Tools',
      blockchain: 'Emerging Tech',
      web3: 'Emerging Tech',
      'full stack': 'Web Development',
      fullstack: 'Web Development',
      'full-stack': 'Web Development',
      'data scien': 'AI & ML',
    };

    const matched = new Set<string>();
    for (const [keyword, topic] of Object.entries(topicMap)) {
      if (goalLower.includes(keyword)) {
        matched.add(topic);
      }
    }

    return Array.from(matched);
  }
}

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

    const cacheKey = `recommend:${numericUserId}`;

    // Check cache first
    const cached = await getCachedData<RecommendationResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, source: 'cache' as const });
    }

    // Fetch user's goal
    const userResult = await db
      .select({ goal: users.goal })
      .from(users)
      .where(eq(users.id, numericUserId))
      .limit(1);

    const userGoal = userResult[0]?.goal || null;

    // Fetch the last 3 progress entries for this user
    const recentProgress = await db
      .select({ score: progress.score })
      .from(progress)
      .where(eq(progress.userId, numericUserId))
      .orderBy(desc(progress.createdAt))
      .limit(3);

    let targetDifficulty: Difficulty = 'beginner';
    let averageScore = 0;

    if (recentProgress.length > 0) {
      const totalScore = recentProgress.reduce((sum, p) => sum + (p.score ?? 0), 0);
      averageScore = Math.round(totalScore / recentProgress.length);
      targetDifficulty = scoreToDifficulty(averageScore);
    }

    // Get IDs of courses the user has completed
    const completedCourses = await db
      .select({ contentId: progress.contentId })
      .from(progress)
      .where(and(eq(progress.userId, numericUserId), eq(progress.completed, 1)));

    const completedIds = completedCourses.map((c) => c.contentId);

    // Build base exclusion condition
    const exclusionCondition =
      completedIds.length > 0 ? notInArray(content.id, completedIds) : undefined;

    let recommendations: (typeof content.$inferSelect)[] = [];

    // ─── Goal-aware recommendations ─────────────────────────────────────
    if (userGoal) {
      const goalTopics = await extractGoalTopics(userGoal);

      if (goalTopics.length > 0) {
        // Build topic match conditions
        const topicConditions = goalTopics.map((t) => eq(content.topic, t));
        const topicFilter =
          topicConditions.length === 1 ? topicConditions[0] : or(...topicConditions);

        // Priority 1: Courses matching goal topics at right difficulty, excluding completed
        const conditions = [topicFilter];
        if (exclusionCondition) conditions.push(exclusionCondition);
        conditions.push(eq(content.difficulty, targetDifficulty));

        recommendations = await db
          .select()
          .from(content)
          .where(and(...conditions))
          .orderBy(sql`RANDOM()`)
          .limit(6);

        // Priority 2: If not enough, relax difficulty but keep topic match
        if (recommendations.length < 3) {
          const relaxedConditions = [topicFilter];
          if (exclusionCondition) relaxedConditions.push(exclusionCondition);
          if (recommendations.length > 0) {
            relaxedConditions.push(
              notInArray(
                content.id,
                recommendations.map((r) => r.id)
              )
            );
          }

          const more = await db
            .select()
            .from(content)
            .where(and(...relaxedConditions))
            .orderBy(sql`RANDOM()`)
            .limit(6 - recommendations.length);

          recommendations = [...recommendations, ...more];
        }
      }
    }

    // ─── Fallback: difficulty-based recommendations ──────────────────────
    if (recommendations.length < 3) {
      const existingIds = recommendations.map((r) => r.id);
      const allExcluded = [...completedIds, ...existingIds];
      const fallbackExclusion =
        allExcluded.length > 0 ? notInArray(content.id, allExcluded) : undefined;

      const fallbackConditions = [eq(content.difficulty, targetDifficulty)];
      if (fallbackExclusion) fallbackConditions.push(fallbackExclusion);

      const fallback = await db
        .select()
        .from(content)
        .where(and(...fallbackConditions))
        .orderBy(sql`RANDOM()`)
        .limit(6 - recommendations.length);

      recommendations = [...recommendations, ...fallback];
    }

    // Final fallback: any uncompleted content
    if (recommendations.length === 0) {
      if (exclusionCondition) {
        recommendations = await db
          .select()
          .from(content)
          .where(exclusionCondition)
          .orderBy(sql`RANDOM()`)
          .limit(6);
      } else {
        recommendations = await db.select().from(content).orderBy(sql`RANDOM()`).limit(6);
      }
    }

    const response: RecommendationResponse = {
      recommendations,
      targetDifficulty,
      averageScore,
      source: 'database',
      goal: userGoal,
    };

    // Cache for 10 minutes
    await setCachedData(cacheKey, response, 600);

    return NextResponse.json(response);
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
