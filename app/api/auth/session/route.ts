import { NextResponse } from 'next/server';
import { getSessionData } from '@/src/lib/session';

export async function GET() {
  try {
    const session = await getSessionData();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: session.userId,
        email: session.email,
        name: session.name,
      },
    });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
