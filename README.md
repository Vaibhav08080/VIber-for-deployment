# SparkSite ⚡

> **Instant AI-Powered Web Application Builder**  
> Build, preview, and deploy high-fidelity web applications instantly by chatting with AI.

Created with ❤️ by **[Vaibhav](https://www.linkedin.com/in/vaibhavkumarprince/)**

---

## 📐 System Design & Architecture

![SparkSite System Architecture](./public/sparksite%20architecture.png)

---

## ✨ Features

- 💬 **Conversational AI Builder:** Generate full-stack modern web apps using natural language prompts.
- ⚡ **Live Preview & Code Explorer:** Real-time web preview with an embedded code editor and virtual file system.
- 🎨 **Cinematic Layout Engine:** High-fidelity, responsive UI layouts tailored with dark mode and sleek glassmorphism aesthetics.
- 🔒 **Secure User Authentication:** Seamless sign-in & sign-up powered by Clerk.
- 🗄️ **Robust Database Storage:** Relational project management powered by PostgreSQL and Prisma ORM.
- 🚀 **Edge Ready:** Built for speed with sub-100ms response times.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS v4, Lucide Icons, Sora & Geist typography
- **Authentication:** Clerk Auth
- **Database & ORM:** PostgreSQL, Prisma ORM
- **API Layer:** tRPC, TanStack Query
- **Async Execution:** Inngest Queue
- **Sandbox Environment:** E2B Code Interpreter

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root directory and add your keys:
```env
DATABASE_URL="your-postgresql-database-url"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm run dev`: Start Next.js development server
- `npm run build`: Build production bundle
- `npm run start`: Run production server
- `npm run lint`: Run ESLint checks

---

## 👤 Author

**Vaibhav**
- LinkedIn: [https://www.linkedin.com/in/vaibhavkumarprince/](https://www.linkedin.com/in/vaibhavkumarprince/)
