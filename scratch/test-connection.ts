import postgres from 'postgres';
import { createClient } from 'redis';

async function testConnectivity() {
  console.log('Testing connectivity to services...');

  // Test Postgres
  try {
    const sql = postgres('postgresql://postgres:postgres@localhost:5432/lernova');
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
      url: 'redis://localhost:6379',
    });

    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();
    console.log('✅ Successfully connected to Redis!');
    await client.disconnect();
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
  }
}

testConnectivity().catch(console.error);
