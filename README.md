<p align="center">
  <img src="https://raw.githubusercontent.com/Batu1-1an/Task-Manager/master/public/favicon.ico" alt="Task Manager Logo" width="64" height="64">
</p>

<h1 align="center">Task Manager</h1>

<p align="center">
  A Notion-inspired productivity app with Kanban boards, calendar views, goal tracking, templates, and AI-powered task suggestions.
  <br><br>
  <a href="https://github.com/Batu1-1an/Task-Manager">
    <img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status">
  </a>
  <a href="https://github.com/Batu1-1an/Task-Manager">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License">
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5">
    <img src="https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-orange?style=flat-square" alt="Stack">
  </a>
  <a href="https://expressjs.com">
    <img src="https://img.shields.io/badge/backend-Express.js-000?style=flat-square" alt="Backend">
  </a>
  <a href="https://supabase.com">
    <img src="https://img.shields.io/badge/database-Supabase-3ECF8E?style=flat-square" alt="Database">
  </a>
  <a href="https://ai.google.dev">
    <img src="https://img.shields.io/badge/ai-Google%20Gemini-4285F4?style=flat-square" alt="AI">
  </a>
  <a href="https://www.netlify.com">
    <img src="https://img.shields.io/badge/deploy-Netlify-00C7B7?style=flat-square" alt="Deploy">
  </a>
</p>

---

## Features

- **📋 Multiple Views** — Switch between List, Kanban (drag & drop), and Calendar views to manage tasks your way.
- **🔐 Authentication** — Email/password sign-up and sign-in, plus Google and GitHub OAuth via Supabase Auth.
- **🤖 AI Suggestions** — Get smart, actionable breakdowns for any task using Google Gemini AI.
- **📝 Rich Text Editing** — Full-featured task details editor with Quill.js (bold, lists, code blocks, images, links).
- **📌 Task Templates** — Save any task as a reusable template. Apply templates to instantly create new tasks.
- **🎯 Goal Tracking** — Create goals with target dates and metrics, link tasks to goals, and watch real-time progress.
- **📅 Calendar Integration** — Visualize all tasks with due dates on an interactive FullCalendar month view.
- **🔄 Kanban Board** — Drag cards across To Do / In Progress / Done columns. Add tasks directly to any column.
- **🏷️ Priority & Due Dates** — Set low / medium / high priority and due dates on every task.
- **👤 Profile Settings** — Update your display name and password directly from the app.
- **📱 Notion-Style UI** — Collapsible sidebar, clean typography (Inter font), subtle shadows, and a familiar productivity workspace feel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (Notion-inspired design), Vanilla JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database & Auth** | Supabase (PostgreSQL, Row-Level Security) |
| **AI** | Google Generative AI (Gemini 1.5 Flash) |
| **Rich Text** | Quill.js |
| **Calendar** | FullCalendar |
| **Drag & Drop** | SortableJS |
| **Icons** | Boxicons |
| **Deployment** | Netlify (static site + serverless functions) |

## Live Demo

> [Live Demo](https://task-manager-batu.netlify.app) — _Deployed on Netlify_

## Getting Started

This is a static site with an optional Express backend for AI features. Deployment is handled by Netlify.

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (for auth and database)
- A [Google Gemini](https://ai.google.dev) API key (for AI suggestions)

### Installation

```bash
# Clone the repository
git clone https://github.com/Batu1-1an/Task-Manager.git
cd Task-Manager

# Install dependencies
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
PORT=3000
```

### Run Locally

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The frontend is entirely static and can be served from any web server. The Node.js server is only required for AI suggestion features.

## Project Structure

```
Task-Manager/
├── public/                      # Static frontend
│   ├── index.html              # Main application layout
│   ├── style.css               # Notion-inspired styles
│   └── script.js               # Application logic (2,000+ lines)
├── docs/                        # Documentation & planning
│   ├── PRD-Notion-Features.md  # Product requirements document
│   ├── auth_plan.md            # Authentication implementation plan
│   ├── profile_settings_plan.md
│   ├── progress.md             # Development progress log
│   ├── Checklist.md            # Project checklist
│   └── user-profile-references.txt
├── netlify/functions/          # Netlify serverless functions (optional)
├── server/                      # Express backend for AI suggestions
│   └── index.js
├── netlify.toml                # Netlify deployment configuration
├── package.json                # Dependencies & scripts
├── .env.example                # Environment variable template
└── .gitignore
```

## Configuration

### `netlify.toml`

```toml
[build]
  command = "npm install"
  publish = "public"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The site publishes from `public/` as a static SPA. API routes are redirected to Netlify Functions for the AI backend.

## Development

### Making Changes

The frontend is pure HTML/CSS/JS — no build step required. Edit files in `public/` and refresh your browser.

### Supabase Setup

The app expects a Supabase project with the following tables:

- **`tasks`** — `id`, `user_id`, `text`, `completed`, `priority`, `due_date`, `details`, `status`, `tags`, `subtasks`, `links`, `goal_id`, `created_at`
- **`goals`** — `id`, `user_id`, `name`, `description`, `target_date`, `metrics`, `completed`, `created_at`
- **`templates`** — `id`, `user_id`, `name`, `task_data` (JSONB), `created_at`

Enable Row-Level Security (RLS) on all tables and create policies to restrict access by `user_id`.

### Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ai-suggestion` | POST | Returns a Gemini-generated task breakdown |

## Deployment

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Batu1-1an/Task-Manager)

1. Connect your GitHub repository to Netlify.
2. Set build command: `npm install`
3. Set publish directory: `public`
4. Add environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`) in the Netlify dashboard.

## License

MIT
