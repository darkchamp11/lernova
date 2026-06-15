#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from pptx import Presentation
from slides.tokens import SLIDE_W, SLIDE_H
from slides.templates import (
    cover_slide, toc_slide, chapter_slide, content_slide, 
    metrics_slide, quote_slide, ending_slide,
    blank_slide, add_page_number
)
from slides.charts import add_bar_chart, add_donut_chart
from slides.helpers import add_eyebrow_header
from pptx.util import Inches

TOTAL_PAGES = 18

def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    # Slide 1: Cover
    cover_slide(prs,
        title="Lernova Platform",
        subtitle="Personalized Smart Learning Platform powered by AI.",
        author="Lernova Team",
        date="April 2026")

    # Slide 2: TOC
    toc_slide(prs, items=[
        "Project Overview & Mission",
        "Modern Technology Stack",
        "Core Features & User Progress",
        "AI Tutor & Real-Time Assessment",
        "Architecture & Schema",
        "Project Impact & Next Steps"
    ])

    # Slide 3: Chapter 1
    chapter_slide(prs, 1, "Project Overview & Mission")

    # Slide 4:
    content_slide(prs,
        eyebrow="Mission · Objective",
        title="Adaptive Education Platform",
        body="Lernova is an intelligent learning companion. It adapts to the user's skill level, tests knowledge in real-time using local LLMs, and recommends courses based on identified knowledge gaps and user goals.",
        bullets=[
            "Personalized Recommendations: Connects users with courses that fit their goals.",
            "Real-Time Quizzes: Generates dynamic MCQ and written questions.",
            "Visual Progress: Radar and bar charts to map knowledge vectors."
        ],
        page_num=4, total_pages=TOTAL_PAGES)

    # Slide 5: Chapter 2
    chapter_slide(prs, 2, "Modern Technology Stack")

    # Slide 6: Tech Stack
    content_slide(prs,
        eyebrow="Technology · Architecture",
        title="Scalable Next.js Ecosystem",
        body="The platform leverages Next.js 15, Drizzle ORM, and Redis for a highly scalable, real-time experience.",
        bullets=[
            "Frontend: Next.js App Router, Tailwind CSS, Recharts for visual tracking.",
            "Backend: Next.js API Routes, Node.js.",
            "Database: PostgreSQL 16 accessed via Drizzle ORM.",
            "Caching: Redis for sessions and fast recommendation retrieval.",
            "Code Quality: Biome.js for blazing fast linting and formatting."
        ],
        page_num=6, total_pages=TOTAL_PAGES)

    # Slide 7: Chapter 3
    chapter_slide(prs, 3, "Core Features & User Progress")

    # Slide 8: Features Overview
    content_slide(prs,
        eyebrow="Features · Operations",
        title="Smart Progress Tracking",
        body="Lernova provides a complete lifecycle for learners, from onboarding to goal completion.",
        bullets=[
            "Goal-Based Enrollment: Users can manage up to 2 active courses at once.",
            "Study Plans: Features AI-generated and custom study to-dos for each course.",
            "Progress Requirements: Requires 75% or higher on final quizzes to pass.",
            "Visual Dashboard: Detailed metrics to track user scores and knowledge dimensions."
        ],
        page_num=8, total_pages=TOTAL_PAGES)

    # Slide 9: Donut Chart - Knowledge
    s = blank_slide(prs)
    add_eyebrow_header(s, "Features · Metrics", "Knowledge Vector Distribution (Sample)")
    add_donut_chart(s, Inches(1.5), Inches(2.2), Inches(10), Inches(4.5), 
                         "Topic Strength",
                         ['Programming', 'Web Dev', 'CS Theory', 'AI & ML', 'DevOps'],
                         [85, 70, 60, 45, 30])
    add_page_number(s, 9, TOTAL_PAGES)

    # Slide 10: Chapter 4
    chapter_slide(prs, 4, "AI Tutor & Real-Time Assessment")

    # Slide 11: AI Integration
    content_slide(prs,
        eyebrow="AI · Intelligence",
        title="Local LLMs via Ollama",
        body="Lernova integrates a robust AI Tutor powered by local LLMs through Ollama, ensuring data privacy and fast inference.",
        bullets=[
            "Streaming Responses: Generates real-time, token-by-token guidance.",
            "Educational Focus: Socratic questioning ensures the AI doesn't just give away answers.",
            "Dynamic Quiz Generation: Real-time generation of MCQs and written questions tailored to the user's difficulty level.",
            "Smart Extraction: Analyzes user learning goals to automatically extract target topics."
        ],
        page_num=11, total_pages=TOTAL_PAGES)

    # Slide 12: Bar Chart - Scores
    s = blank_slide(prs)
    add_eyebrow_header(s, "AI · Assessment", "Recent Quiz Performance (Sample)")
    add_bar_chart(s, Inches(1.5), Inches(2.2), Inches(10), Inches(4.5), 
                       "Quiz Scores",
                       ["React Basics", "Node JS Intro", "SQL Adv", "Python Data", "Docker"],
                       {
                           "Score (%)": [85, 78, 65, 92, 70]
                       })
    add_page_number(s, 12, TOTAL_PAGES)

    # Slide 13: Chapter 5
    chapter_slide(prs, 5, "Architecture & Schema")

    # Slide 14: Data Flow
    content_slide(prs,
        eyebrow="Architecture · Data",
        title="Drizzle ORM & PostgreSQL Schema",
        body="A highly relational schema built for complex progress tracking and personalized learning vectors.",
        bullets=[
            "Users: Stores authentication details, sessions via Redis, and JSON knowledge vectors.",
            "Content: Courses categorized by topic, difficulty, and keywords.",
            "Progress & Enrollments: Tracks historical progress, active enrollments, and dynamic study tasks.",
            "ML Ready: Schema is optimized for Phase 2 deep learning recommendations via FastAPI."
        ],
        page_num=14, total_pages=TOTAL_PAGES)

    # Slide 15: Metrics
    metrics_slide(prs,
        eyebrow="Architecture · Performance",
        title="System Capabilities",
        body="Lernova is designed to scale with a decoupled Next.js API, Redis caching, and Docker deployments.",
        metrics=[
            ("<100ms", "Cache Latency"),
            ("1 Hour", "Rec. TTL"),
            ("2", "Active Courses"),
            ("100%", "Containerized")
        ],
        page_num=15, total_pages=TOTAL_PAGES)

    # Slide 16: Chapter 6
    chapter_slide(prs, 6, "Project Impact & Next Steps")

    # Slide 17: Quote
    quote_slide(prs,
        quote="Personalized learning requires systems that adapt faster than the student can learn.",
        source="Lernova Core Principle",
        page_num=17, total_pages=TOTAL_PAGES)

    # Slide 18: Ending
    ending_slide(prs,
        message="Thank You!",
        contact="Lernova Platform · Phase 1 Complete")

    prs.save('lernova_presentation.pptx')
    print("OK: Saved lernova_presentation.pptx with 18 slides!")

if __name__ == '__main__':
    main()
