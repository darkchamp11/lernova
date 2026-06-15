import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { generateAIJSON } from '@/src/lib/ai-provider';
import { deleteCachedData } from '@/src/lib/redis';

interface GoalValidationResult {
  valid: boolean;
  message: string;
  keywords: string[];
}

/**
 * GET — Fetch the current goal for a user.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await db
      .select({ goal: users.goal })
      .from(users)
      .where(eq(users.id, Number(userId)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ goal: user[0].goal });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

/**
 * POST — Validate a learning goal using AI and save it if valid.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, goal } = body;

    if (!userId || !goal) {
      return NextResponse.json({ error: 'userId and goal are required' }, { status: 400 });
    }

    const trimmedGoal = goal.trim();

    if (trimmedGoal.length < 5) {
      return NextResponse.json({
        valid: false,
        message: 'Please provide a more detailed learning goal (at least 5 characters).',
      });
    }

    if (trimmedGoal.length > 500) {
      return NextResponse.json({
        valid: false,
        message: 'Please keep your goal under 500 characters.',
      });
    }

    // Use AI to validate the goal
    const prompt = `Analyze the following text and determine if it is a valid learning goal for an educational platform.

Text: "${trimmedGoal}"

A valid learning goal should:
- Express a desire to learn something specific (e.g., "I want to learn web development", "Become a data scientist", "Master Python programming")
- Be coherent and meaningful in English
- Relate to education, skills, career, or personal development

An INVALID goal is:
- Random characters or gibberish (e.g., "asdfhjkl", "123456", "aaaa")
- Nonsensical text that doesn't convey meaning
- Offensive or inappropriate content
- Completely unrelated to learning (e.g., "pizza delivery")

Respond with valid JSON only:
{
  "valid": true/false,
  "message": "If invalid, a friendly message explaining why and asking the user to provide a real learning goal. If valid, a short encouraging message.",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

For the keywords array:
- If valid, extract 2-5 topic keywords that relate to the goal (e.g., ["web development", "javascript", "react", "frontend"])
- If invalid, return an empty array []`;

    const { data } = await generateAIJSON<GoalValidationResult>(prompt, {
      temperature: 0.3,
      maxTokens: 512,
      systemPrompt: 'You are a goal validation assistant. Respond in valid JSON only.',
    });

    if (!data.valid) {
      return NextResponse.json({
        valid: false,
        message:
          data.message ||
          'Please provide a valid learning goal that describes what you want to learn.',
      });
    }

    // Save the goal
    await db
      .update(users)
      .set({ goal: trimmedGoal, updatedAt: new Date() })
      .where(eq(users.id, Number(userId)));

    // Invalidate recommendation cache
    await deleteCachedData(`recommend:${userId}`);

    return NextResponse.json({
      valid: true,
      message: data.message || "Great goal! Let's get started.",
      keywords: data.keywords || [],
      goal: trimmedGoal,
    });
  } catch (error) {
    console.error('Error validating goal:', error);

    // If AI validation fails, do a basic sanity check and save anyway
    const body = await request
      .clone()
      .json()
      .catch(() => null);
    if (body?.goal && body.goal.trim().length >= 10) {
      try {
        await db
          .update(users)
          .set({ goal: body.goal.trim(), updatedAt: new Date() })
          .where(eq(users.id, Number(body.userId)));

        await deleteCachedData(`recommend:${body.userId}`);

        return NextResponse.json({
          valid: true,
          message: 'Goal saved!',
          keywords: [],
          goal: body.goal.trim(),
        });
      } catch {
        // Fall through to error
      }
    }

    return NextResponse.json({ error: 'Failed to validate goal' }, { status: 500 });
  }
}
