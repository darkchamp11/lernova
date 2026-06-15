import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { createSession } from '@/src/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user by username
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user[0].password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Create session
    const sessionId = await createSession({
      userId: user[0].id,
      email: user[0].email,
      name: user[0].name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user[0].id,
        username: user[0].username,
        name: user[0].name,
        email: user[0].email,
      },
      sessionId,
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
