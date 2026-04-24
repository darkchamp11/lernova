import { eq, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { createSession } from '@/src/lib/session';

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, name, email } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email || username)))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        name: name || username,
        email: email || `${username}@lernova.local`,
        knowledgeVec: [],
      })
      .returning();

    // Create session
    const sessionId = await createSession({
      userId: newUser[0].id,
      email: newUser[0].email,
      name: newUser[0].name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        name: newUser[0].name,
        email: newUser[0].email,
      },
      sessionId,
    });
  } catch (error) {
    console.error('Error in registration:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
