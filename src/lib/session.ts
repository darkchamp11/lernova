import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { deleteSession, getSession, setSession } from './redis';

export interface SessionData {
  userId: number;
  email: string;
  name: string;
  createdAt: number;
}

const SESSION_COOKIE_NAME = 'session_id';
const SESSION_DURATION = Number(process.env.SESSION_DURATION) || 86400; // 24 hours

export async function createSession(userData: Omit<SessionData, 'createdAt'>): Promise<string> {
  const sessionId = nanoid();
  const sessionData: SessionData = {
    ...userData,
    createdAt: Date.now(),
  };

  await setSession(sessionId, sessionData, SESSION_DURATION);

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });

  return sessionId;
}

export async function getSessionData(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const sessionData = await getSession(sessionId);
  return sessionData as SessionData | null;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await deleteSession(sessionId);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSessionData();
  if (!session) {
    throw new Error('Unauthorized - No active session');
  }
  return session;
}
