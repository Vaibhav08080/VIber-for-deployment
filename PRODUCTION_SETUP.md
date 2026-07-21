# Vibel Production Setup & Configuration Guide

This single guide contains **everything required** to set up, configure, and deploy **Vibel: The Editorial AI Builder** to production.

---

## 1. Required Environment Variables

Add the following environment variables to your deployment dashboard (**Vercel / Netlify / AWS ECS / Render**):

```env
# 1. PostgreSQL Database Connection String (Neon, AWS Aurora, or Supabase)
DATABASE_URL="postgresql://user:password@host:5432/vibel?schema=public&sslmode=require"

# 2. Public Application URL (your live domain)
NEXT_PUBLIC_APP_URL="https://vibel.app"

# 3. Clerk Authentication (from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
CLERK_SECRET_KEY="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"

# 4. OpenAI API Key (from https://platform.openai.com)
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"

# 5. Inngest Event Queue (from https://app.inngest.com)
INNGEST_EVENT_KEY="ink_xxxxxxxxxxxxxxxxxxxxxxxx"
INNGEST_SIGNING_KEY="signkey-prod-xxxxxxxxxxxxxxxxxxxxxxxx"

# 6. E2B Sandbox Code Interpreter (from https://e2b.dev)
E2B_API_KEY="e2b_xxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 2. Step-by-Step Setup Instructions

### Step 1: Database Migration
Before deploying, run the Prisma schema synchronization to set up tables (`Project`, `Message`, `Fragment`, `Usage`):

```bash
# Generate Prisma Client
npx prisma generate

# Push schema directly to PostgreSQL database
npx prisma db push
```

### Step 2: Configure Clerk Authentication
1. Go to [Clerk Dashboard](https://dashboard.clerk.com).
2. Set your **Redirect URLs** in Clerk:
   - Sign-in redirect: `https://your-domain.com/`
   - Sign-up redirect: `https://your-domain.com/`
3. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` into your environment variables.

### Step 3: Configure Inngest Job Queue
1. Connect your GitHub repository to [Inngest Cloud](https://app.inngest.com).
2. Set the Inngest Webhook sync URL to:
   ```
   https://your-domain.com/api/inngest
   ```

---

## 3. Production Build & Verification Commands

To test your production build locally before pushing:

```bash
# 1. Install dependencies
npm install

# 2. Build production bundle
npm run build

# 3. Start local production server
npm run start
```

---

## 4. Key Files Reference

| File | Purpose |
| :--- | :--- |
| [.env.example](file:///Users/kumar/Desktop/vibel/VIber-for-deployment/.env.example) | Template for all environment variables |
| [prisma/schema.prisma](file:///Users/kumar/Desktop/vibel/VIber-for-deployment/prisma/schema.prisma) | PostgreSQL Database schema definition |
| [src/app/(home)/page.tsx](file:///Users/kumar/Desktop/vibel/VIber-for-deployment/src/app/(home)/page.tsx) | Landing page & WebGL background interface |
| [src/modules/home/ui/components/project-list.tsx](file:///Users/kumar/Desktop/vibel/VIber-for-deployment/src/modules/home/ui/components/project-list.tsx) | Projects dashboard & bulk deletion |
| [src/modules/projects/server/procedures.ts](file:///Users/kumar/Desktop/vibel/VIber-for-deployment/src/modules/projects/server/procedures.ts) | tRPC API procedures (`create`, `getMany`, `deleteAll`) |
