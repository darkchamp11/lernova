import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function createDb() {
  const dbUrl = process.env.DATABASE_URL;
  const url = new URL(dbUrl);
  url.pathname = '/postgres'; // Connect to default postgres DB
  
  const sql = postgres(url.toString());
  try {
    await sql`CREATE DATABASE lernova`;
    console.log('✅ Database "lernova" created successfully!');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database already exists.');
    } else {
      console.error('Error creating database:', err);
    }
  } finally {
    await sql.end();
  }
}

createDb();
