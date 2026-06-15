import { NextResponse } from 'next/server';
import { generateAIJSON } from '@/src/lib/ai-provider';

interface MCQAnswer {
  question: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string;
}

interface WrittenAnswer {
  question: string;
  answer: string;
}

interface AnalyzeRequest {
  topic: string;
  difficulty: string;
  mcqAnswers: MCQAnswer[];
  writtenAnswer: WrittenAnswer;
}

interface MCQFeedback {
  questionIndex: number;
  correct: boolean;
  explanation: string;
}

interface WrittenFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
}

interface AnalysisResult {
  overallScore: number;
  mcqFeedback: MCQFeedback[];
  writtenFeedback: WrittenFeedback;
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { topic, difficulty, mcqAnswers, writtenAnswer } = body;

    if (!mcqAnswers || !writtenAnswer) {
      return NextResponse.json(
        { error: 'mcqAnswers and writtenAnswer are required' },
        { status: 400 }
      );
    }

    // Build the MCQ section of the prompt
    const mcqSection = mcqAnswers
      .map(
        (a, i) =>
          `Q${i + 1}: ${a.question}\nOptions: ${a.options.join(' | ')}\nCorrect: ${a.correctAnswer}\nStudent chose: ${a.selectedAnswer}`
      )
      .join('\n\n');

    const prompt = `You are an educational assessment expert. Analyze a student's quiz submission on "${topic}" (${difficulty} level).

## Multiple Choice Questions
${mcqSection}

## Written Answer Question
Question: ${writtenAnswer.question}
Student's Answer: ${writtenAnswer.answer || '(no answer provided)'}

## Instructions
Analyze the submission and respond with valid JSON only using this EXACT structure:
{
  "overallScore": <number 0-100>,
  "mcqFeedback": [
    {
      "questionIndex": <number starting from 0>,
      "correct": <boolean>,
      "explanation": "<explain why the answer is correct or why the student's choice was wrong and what the right concept is>"
    }
  ],
  "writtenFeedback": {
    "score": <number 0-100>,
    "feedback": "<detailed evaluation of the written answer — what was good, what was missing, any misconceptions>",
    "suggestions": ["<specific improvement suggestion 1>", "<specific improvement suggestion 2>"]
  }
}

Scoring rules:
- MCQ section is worth 70% of the overall score
- Written answer is worth 30% of the overall score
- For MCQ: calculate percentage of correct answers
- For written answer: evaluate completeness, accuracy, and depth
- overallScore = Math.round(mcqPercentage * 0.7 + writtenScore * 0.3)

Be encouraging but honest. Provide specific, educational feedback.`;

    const { data } = await generateAIJSON<AnalysisResult>(prompt, {
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt: 'You are an expert educational assessment AI. Always respond in valid JSON.',
    });

    // Validate the structure
    if (
      typeof data.overallScore !== 'number' ||
      !Array.isArray(data.mcqFeedback) ||
      !data.writtenFeedback
    ) {
      return NextResponse.json(
        { error: 'AI returned an unexpected response format. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error analyzing quiz:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze quiz' },
      { status: 500 }
    );
  }
}
