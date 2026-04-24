import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Connect to Redis
let isConnected = false;

export async function getRedisClient() {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
  }
  return redisClient;
}

// Cache helpers
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

export async function setCachedData(
  key: string,
  data: unknown,
  expirationInSeconds = 3600
): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.setEx(key, expirationInSeconds, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting cached data:', error);
  }
}

export async function deleteCachedData(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('Error deleting cached data:', error);
  }
}

// Session helpers
export async function getSession(sessionId: string): Promise<unknown | null> {
  return getCachedData(`session:${sessionId}`);
}

export async function setSession(
  sessionId: string,
  sessionData: unknown,
  expirationInSeconds = 86400
): Promise<void> {
  await setCachedData(`session:${sessionId}`, sessionData, expirationInSeconds);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await deleteCachedData(`session:${sessionId}`);
}

export default redisClient;
