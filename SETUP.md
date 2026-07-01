# اردو تعلیمی پلیٹ فارم — Setup

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
cp .env.example .env.local
# Edit ANTHROPIC_API_KEY with your real key from console.anthropic.com

# 3. Set up database and seed demo data
npm run setup

# 4. Start development server
npm run dev
# Open http://localhost:3000
```

## Demo Accounts

Search for **"نمونہ اسکول"** on the login page first, then sign in:

| Role | Email | Password |
|------|-------|----------|
| استاد (Teacher) | teacher@urduedtech.pk | teacher123 |
| طالب علم (Student) | student@urduedtech.pk | student123 |

**Demo Class Code:** `URDU01`  
**Demo Org Join Code:** `SCHOOL01`

## Urdu Language Engine

The student IDE runs Urdu code via `public/urdu.jar`. Java 17+ must be installed on the server.

```bash
# Verify Java is available
java -version

# Test the engine directly
java -jar public/urdu.jar run path/to/file.urdu
```

## Features

### Teacher
- Dashboard with stats, recent activity
- Class management (create, view roster, grade book)
- Assignment creation (written, code, ide types)
- Publish/unpublish assignments
- Curriculum library (create & share)
- Analytics with bar charts and pie charts

### Student
- Dashboard with pending/completed assignments
- Join classes via class code
- Submit assignments with the embedded Urdu IDE
- **AI Tutor (استاد جی)** — Urdu-language Claude-powered tutor
- **Urdu IDE** — Urdu, Python, JavaScript, HTML with Monaco Editor

## Environment Variables

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."   # Required for AI Tutor
```

## Database Commands

```bash
npx prisma db push        # Apply schema
npx tsx prisma/seed.ts    # Seed demo data
npx prisma studio         # Browse data
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** SQLite via Prisma ORM
- **Auth:** NextAuth.js (credentials)
- **AI:** Anthropic Claude (`claude-sonnet-4-6`)
- **Editor:** Monaco Editor
- **Charts:** Recharts
- **Styling:** Tailwind CSS v4 (RTL throughout)
- **UI:** Lucide React icons
