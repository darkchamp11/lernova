import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();

pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Lernova AI';
pptx.company = 'Lernova';
pptx.revision = '1';
pptx.subject = 'Lernova Platform Overview';
pptx.title = 'Lernova Project Presentation';

// Define master slide for basic theme
pptx.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: 'F8FAFC' }, // slate-50
  objects: [
    {
      rect: { x: 0, y: 0, w: '100%', h: 0.75, fill: { color: '4F46E5' } } // indigo-600 top bar
    },
    {
      text: {
        text: 'Lernova Platform',
        options: { x: 0.5, y: 0.15, w: 3, h: 0.5, fontFace: 'Arial', fontSize: 18, color: 'FFFFFF', bold: true }
      }
    },
    {
      text: {
        text: 'Phase 1 Prototype',
        options: { x: '80%', y: 0.15, w: 2, h: 0.5, fontFace: 'Arial', fontSize: 14, color: 'E0E7FF', align: 'right' }
      }
    }
  ]
});

// 1. Title Slide
const slideTitle = pptx.addSlide();
slideTitle.background = { color: '4F46E5' }; // indigo-600
slideTitle.addText('Lernova', {
  x: 0, y: 1.5, w: '100%', h: 1.5, align: 'center', fontSize: 64, bold: true, color: 'FFFFFF', fontFace: 'Arial'
});
slideTitle.addText('Personalized Smart Learning Platform', {
  x: 0, y: 3.0, w: '100%', h: 1, align: 'center', fontSize: 28, color: 'E0E7FF', fontFace: 'Arial'
});
slideTitle.addText('AI-Powered Adaptive Education', {
  x: 0, y: 4.5, w: '100%', h: 1, align: 'center', fontSize: 20, color: 'C7D2FE', fontFace: 'Arial'
});

// 2. Overview Slide
const slideOverview = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slideOverview.addText('Project Overview', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '1E293B', fontFace: 'Arial' });
slideOverview.addText([
  { text: 'What is Lernova?', options: { bold: true, breakLine: true, fontSize: 20 } },
  { text: 'An intelligent learning companion that adapts to user skill levels, tests knowledge in real-time, and provides personalized course recommendations.', options: { breakLine: true } },
  { text: 'Key Goals:', options: { bold: true, breakLine: true, fontSize: 20 } },
  { text: '• Personalize education using AI and heuristic engines\n• Track learning progress and knowledge vectors visually\n• Provide a fast, modern, and reliable user experience', options: { breakLine: true } }
], { x: 0.5, y: 1.8, w: '90%', fontSize: 18, color: '334155', fontFace: 'Arial', bullet: false, lineSpacing: 30 });

// 3. Tech Stack
const slideTech = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slideTech.addText('Modern Technology Stack', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '1E293B', fontFace: 'Arial' });

const techItems = [
  ['Frontend', 'Next.js 15 (App Router), Tailwind CSS, Recharts'],
  ['Backend', 'Node.js, Next.js API Routes'],
  ['Database', 'PostgreSQL 16 (via Drizzle ORM)'],
  ['Caching & Sessions', 'Redis 7'],
  ['AI & LLMs', 'Ollama (Local Models), Groq API'],
  ['Code Quality', 'Biome.js (Linting & Formatting)'],
  ['Deployment', 'Docker & Docker Compose']
];

slideTech.addTable(techItems, {
  x: 0.5, y: 1.8, w: '90%', rowH: 0.5,
  fill: 'FFFFFF', color: '334155', fontSize: 16, fontFace: 'Arial',
  border: { type: 'solid', color: 'CBD5E1', pt: 1 }
});

// 4. Core Features
const slideFeatures = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slideFeatures.addText('Core Platform Features', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '1E293B', fontFace: 'Arial' });
slideFeatures.addText([
  { text: 'Secure Authentication', options: { bold: true, breakLine: true } },
  { text: '• Redis-based session storage with secure cookies', options: { breakLine: true } },
  { text: 'Smart Recommendations', options: { bold: true, breakLine: true } },
  { text: '• Suggests courses based on learning goals, past progress, and knowledge gaps', options: { breakLine: true } },
  { text: 'Visual Progress Tracking', options: { bold: true, breakLine: true } },
  { text: '• Radar charts for knowledge mapping and bar charts for recent scores', options: { breakLine: true } },
  { text: 'Goal-Based Enrollments', options: { bold: true, breakLine: true } },
  { text: '• Limits to 2 active courses with dynamic study to-do lists', options: { breakLine: true } }
], { x: 0.5, y: 1.8, w: '90%', fontSize: 16, color: '334155', fontFace: 'Arial', lineSpacing: 25 });

// 5. AI Capabilities
const slideAI = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slideAI.addText('AI-Powered Learning Features', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '1E293B', fontFace: 'Arial' });
slideAI.addText([
  { text: 'Real-Time Knowledge Checks', options: { bold: true, breakLine: true } },
  { text: '• Dynamically generates unique quizzes based on target topic and difficulty\n• Provides immediate feedback and explanations', options: { breakLine: true } },
  { text: 'Interactive AI Tutor', options: { bold: true, breakLine: true } },
  { text: '• Local LLM integration via Ollama for real-time streaming chat\n• System prompts strictly tuned for educational guidance and Socratic questioning\n• Aware of the user\'s knowledge vectors to personalize responses', options: { breakLine: true } },
  { text: 'Smart Topic Extraction', options: { bold: true, breakLine: true } },
  { text: '• AI analyzes user goals to extract and map to standard learning topics', options: { breakLine: true } }
], { x: 0.5, y: 1.8, w: '90%', fontSize: 16, color: '334155', fontFace: 'Arial', lineSpacing: 25 });

// 6. Architecture
const slideArch = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slideArch.addText('Architecture & Data Flow', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '1E293B', fontFace: 'Arial' });
slideArch.addText(
  'User -> Next.js Frontend -> Next.js API Routes -> Drizzle ORM -> PostgreSQL\n' +
  '                                               -> Redis (Cache/Sessions)\n' +
  '                                               -> AI Provider (Ollama/Groq)',
  { x: 0.5, y: 2.0, w: '90%', h: 1.5, fill: 'E2E8F0', color: '1E293B', fontSize: 16, fontFace: 'Courier New', align: 'center', valign: 'middle' }
);
slideArch.addText('Database Schema Highlights:', { x: 0.5, y: 3.8, fontSize: 20, bold: true, color: '1E293B', fontFace: 'Arial' });
slideArch.addText('• Users: Tracks credentials, goals, and knowledge vector arrays\n• Content: Courses, difficulties, topics\n• Progress & Enrollments: Tracks active courses, scores, and study tasks', { x: 0.5, y: 4.3, w: '90%', fontSize: 16, color: '334155', fontFace: 'Arial', lineSpacing: 20 });

// 7. Conclusion
const slideConclusion = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slideConclusion.addText('Phase 1 Success & Future Outlook', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '1E293B', fontFace: 'Arial' });
slideConclusion.addText([
  { text: 'Phase 1 Complete', options: { bold: true, breakLine: true } },
  { text: '• Solid foundation with secure auth, database schema, and caching\n• Core UI dashboard, AI tutor, and dynamic quizzes implemented', options: { breakLine: true } },
  { text: 'Phase 2 Readiness', options: { bold: true, breakLine: true } },
  { text: '• Deep learning recommendation models via FastAPI\n• Advanced collaborative filtering\n• Adaptive difficulty adjustments based on continuous real-time analytics', options: { breakLine: true } }
], { x: 0.5, y: 1.8, w: '90%', fontSize: 18, color: '334155', fontFace: 'Arial', lineSpacing: 30 });

// Save the Presentation
pptx.writeFile({ fileName: 'd:/lernova/Lernova_Presentation.pptx' })
  .then(fileName => {
    console.log(`Successfully created: ${fileName}`);
  })
  .catch(err => {
    console.error('Error generating presentation:', err);
  });
