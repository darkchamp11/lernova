import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from '../src/db';
import { content, users } from '../src/db/schema';

const SALT_ROUNDS = 10;

const seedData = async () => {
  console.log('🌱 Seeding database...');

  try {
    // Seed users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);
    
    const sampleUsers = await db
      .insert(users)
      .values([
        {
          username: 'demo',
          password: hashedPassword,
          name: 'Demo User',
          email: 'demo@lernova.com',
          knowledgeVec: [0.5, 0.7, 0.3, 0.8, 0.6],
        },
        {
          username: 'alice',
          password: hashedPassword,
          name: 'Alice Johnson',
          email: 'alice@example.com',
          knowledgeVec: [0.8, 0.6, 0.9, 0.4, 0.7],
        },
        {
          username: 'bob',
          password: hashedPassword,
          name: 'Bob Smith',
          email: 'bob@example.com',
          knowledgeVec: [0.3, 0.9, 0.5, 0.7, 0.4],
        },
      ])
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${sampleUsers.length} users (password: password123)`);

    // Seed content (courses)
    console.log('Creating courses...');
    const courses = await db
      .insert(content)
      .values([
        {
          title: 'Introduction to Python Programming',
          topic: 'Programming',
          difficulty: 'beginner',
          keywords: ['python', 'programming', 'basics', 'syntax'],
          description:
            'Learn the fundamentals of Python programming from scratch. Perfect for beginners with no prior coding experience.',
        },
        {
          title: 'Advanced JavaScript Patterns',
          topic: 'Web Development',
          difficulty: 'advanced',
          keywords: ['javascript', 'design patterns', 'async', 'closures'],
          description:
            'Master advanced JavaScript concepts including closures, prototypes, async patterns, and modern ES6+ features.',
        },
        {
          title: 'Data Structures & Algorithms',
          topic: 'Computer Science',
          difficulty: 'intermediate',
          keywords: ['algorithms', 'data structures', 'optimization', 'complexity'],
          description:
            'Deep dive into essential data structures and algorithms. Learn how to analyze time complexity and optimize code.',
        },
        {
          title: 'Machine Learning Fundamentals',
          topic: 'AI & ML',
          difficulty: 'intermediate',
          keywords: ['machine learning', 'AI', 'neural networks', 'tensorflow'],
          description:
            'Understand the core concepts of machine learning, from linear regression to neural networks.',
        },
        {
          title: 'React & Next.js Full Stack',
          topic: 'Web Development',
          difficulty: 'intermediate',
          keywords: ['react', 'nextjs', 'typescript', 'fullstack'],
          description:
            'Build modern full-stack applications with React and Next.js. Includes server components and API routes.',
        },
        {
          title: 'Database Design with PostgreSQL',
          topic: 'Databases',
          difficulty: 'intermediate',
          keywords: ['postgresql', 'sql', 'database design', 'normalization'],
          description:
            'Learn how to design efficient database schemas, write complex queries, and optimize performance.',
        },
        {
          title: 'DevOps with Docker & Kubernetes',
          topic: 'DevOps',
          difficulty: 'advanced',
          keywords: ['docker', 'kubernetes', 'CI/CD', 'containerization'],
          description:
            'Master containerization and orchestration. Deploy scalable applications using Docker and Kubernetes.',
        },
        {
          title: 'CSS Grid & Flexbox Mastery',
          topic: 'Web Development',
          difficulty: 'beginner',
          keywords: ['css', 'grid', 'flexbox', 'layout'],
          description:
            'Learn modern CSS layout techniques with Grid and Flexbox. Create responsive designs with ease.',
        },
        {
          title: 'System Design Essentials',
          topic: 'Software Engineering',
          difficulty: 'advanced',
          keywords: ['system design', 'scalability', 'architecture', 'microservices'],
          description:
            'Learn how to design scalable, distributed systems. Perfect for preparing for senior engineering roles.',
        },
        {
          title: 'Git & GitHub for Teams',
          topic: 'Tools',
          difficulty: 'beginner',
          keywords: ['git', 'github', 'version control', 'collaboration'],
          description:
            'Master version control with Git and collaborate effectively using GitHub workflows and best practices.',
        },
        {
          title: 'TypeScript Deep Dive',
          topic: 'Programming',
          difficulty: 'intermediate',
          keywords: ['typescript', 'types', 'generics', 'advanced types'],
          description:
            'Go beyond the basics of TypeScript. Learn advanced type systems, generics, and utility types.',
        },
        {
          title: 'RESTful API Design',
          topic: 'Backend Development',
          difficulty: 'intermediate',
          keywords: ['REST', 'API', 'HTTP', 'design patterns'],
          description:
            'Learn best practices for designing clean, scalable RESTful APIs with proper error handling and documentation.',
        },
        {
          title: 'Introduction to Blockchain',
          topic: 'Emerging Tech',
          difficulty: 'beginner',
          keywords: ['blockchain', 'cryptocurrency', 'web3', 'smart contracts'],
          description:
            'Understand the fundamentals of blockchain technology and its applications beyond cryptocurrency.',
        },
        {
          title: 'Redis Caching Strategies',
          topic: 'Databases',
          difficulty: 'intermediate',
          keywords: ['redis', 'caching', 'performance', 'in-memory'],
          description:
            'Learn how to implement effective caching strategies using Redis to improve application performance.',
        },
        {
          title: 'Cloud Computing with AWS',
          topic: 'Cloud',
          difficulty: 'intermediate',
          keywords: ['aws', 'cloud', 'serverless', 'infrastructure'],
          description:
            'Get started with AWS cloud services. Learn about EC2, S3, Lambda, and other essential services.',
        },
      ])
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Created ${courses.length} courses`);

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Summary:
   - Users: ${sampleUsers.length}
   - Courses: ${courses.length}
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
