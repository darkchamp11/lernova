import postgres from 'postgres';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

async function testConnectivity() {
  console.log('Testing connectivity to services...');

  // Test Postgres
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL is not set in .env');
    const sql = postgres(dbUrl);
    const result = await sql`SELECT version()`;
    console.log('✅ Successfully connected to Postgres!');
    console.log(`   Version: ${result[0].version}`);
    await sql.end();
  } catch (error) {
    console.error('❌ Failed to connect to Postgres:', error);
  }

  // Test Redis
  try {
    const client = createClient({
      url: 'redis://localhost:6379'
    });
    
    client.on('error', err => console.error('Redis Client Error', err));
    
    await client.connect();
    console.log('✅ Successfully connected to Redis!');
    await client.disconnect();
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
  }
}

testConnectivity().catch(console.error);
