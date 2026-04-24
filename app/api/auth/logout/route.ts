import { NextResponse } from 'next/server';
import { destroySession } from '@/src/lib/session';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
