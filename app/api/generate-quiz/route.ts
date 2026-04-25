import { NextResponse } from 'next/server';
import { generateAIJSON } from '@/src/lib/ai-provider';

interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation: string;
  type: 'mcq' | 'written';
}

interface GenerateQuizRequest {
  topic: string;
  difficulty: string;
  count?: number;
}

interface GenerateQuizResponse {
  questions: QuizQuestion[];
}

export async function POST(request: Request) {
  try {
    const body: GenerateQuizRequest = await request.json();
    const { topic, difficulty, count = 4 } = body;

    if (!topic || !difficulty) {
      return NextResponse.json(
        { error: 'topic and difficulty are required' },
        { status: 400 },
      );
    }

    const mcqCount = Math.max(1, count - 1);

    const prompt = `Generate a quiz about "${topic}" at "${difficulty}" difficulty level.

You MUST respond with valid JSON only using this exact structure:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact text of the correct option",
      "explanation": "A brief explanation of why the correct answer is right",
      "type": "mcq"
    },
    {
      "question": "An open-ended question requiring a written answer",
      "explanation": "Key points that a good answer should cover",
      "type": "written"
    }
  ]
}

Requirements:
- Generate exactly ${mcqCount} multiple-choice questions (type: "mcq") followed by exactly 1 written-answer question (type: "written")
- Each MCQ must have exactly 4 options with one correct answer
- The correctAnswer must exactly match one of the options
- MCQ questions should test understanding, not just recall
- The written question should require a thoughtful, multi-sentence explanation
- Written questions should NOT have "options" or "correctAnswer" fields
- Each question must be UNIQUE — no duplicate or similar questions
- Difficulty "${difficulty}" means: beginner = basic concepts, intermediate = applied knowledge, advanced = deep understanding
- All questions should be educational and about "${topic}"
- Explanations should be concise (1-2 sentences)`;

    const { data } = await generateAIJSON<GenerateQuizResponse>(prompt, {
      temperature: 0.8,
      maxTokens: 2048,
      systemPrompt:
        'You are an expert educational quiz generator. Always produce unique, high-quality quiz questions. Always respond in valid JSON.',
    });

    // Validate the structure
    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      return NextResponse.json(
        { error: 'AI model returned an invalid quiz format. Please try again.' },
        { status: 500 },
      );
    }

    // Validate each question
    for (const q of data.questions) {
      if (!q.question || !q.type) {
        return NextResponse.json(
          { error: 'AI model returned a question with missing fields. Please try again.' },
          { status: 500 },
        );
      }
      if (q.type === 'mcq') {
        if (
          !Array.isArray(q.options) ||
          q.options.length < 2 ||
          !q.correctAnswer
        ) {
          return NextResponse.json(
            { error: 'AI model returned an invalid MCQ format. Please try again.' },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating quiz:', error);

    if (error instanceof TypeError && (error as TypeError).message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Cannot connect to any AI provider. Make sure Ollama is running or GROQ_API_KEY is set.' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz questions' },
      { status: 500 },
    );
  }
}
