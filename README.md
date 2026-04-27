<div align="center">
  <img src="https://raw.githubusercontent.com/Batu1-1an/Task-Manager/master/public/favicon.ico" alt="Task Manager Logo" width="72" height="72">
  <h1 style="margin: 0.25em 0 0.1em; font-size: 2.75rem;">Task Manager</h1>
  <p style="font-size: 1.1rem; color: #555; max-width: 560px; margin: 0 auto 0.75rem;">
    A Notion-inspired productivity app — Kanban boards, calendar views, goal tracking, templates, and AI-powered task suggestions.
  </p>

  <a href="https://github.com/Batu1-1an/Task-Manager"><img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status"></a>
  <a href="https://github.com/Batu1-1an/Task-Manager/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/HTML"><img src="https://img.shields.io/badge/frontend-HTML5%2FCSS3%2FJS-orange?style=flat-square" alt="Frontend"></a>
  <a href="https://expressjs.com"><img src="https://img.shields.io/badge/backend-Express.js-000?style=flat-square" alt="Backend"></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/database-Supabase-3ECF8E?style=flat-square" alt="Database"></a>
  <a href="https://ai.google.dev"><img src="https://img.shields.io/badge/ai-Google%20Gemini-4285F4?style=flat-square" alt="AI"></a>
  <a href="https://www.netlify.com"><img src="https://img.shields.io/badge/deploy-Netlify-00C7B7?style=flat-square" alt="Deploy"></a>
</div>

<br>

---

## Why Task Manager?

Notion is powerful — but it's a generalist. **Task Manager** is a specialist. Built for people who want the familiar, clean aesthetics of Notion but need a **dedicated, customizable task management experience** without the overhead of a full workspace tool.

Every feature — from the collapsible sidebar to the Kanban columns — is designed around one question: *"Does this help me get things done faster?"* The result is a lean, fast, beautiful task manager that stays out of your way and puts your work front and center.

---

## Live Demo

<div align="center">
  <a href="https://task-manager-batu.netlify.app" style="display: inline-block; padding: 14px 36px; background: #00C7B7; color: #fff; border-radius: 8px; font-size: 1.15rem; font-weight: 600; text-decoration: none; letter-spacing: 0.3px;">🚀 Launch Live Demo</a>
  <br>
  <em>Deployed on Netlify — no account required to explore</em>
</div>

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 🗂️ | **Multiple Views** | Switch between **List**, **Kanban** (drag & drop), and **Calendar** views. Every view shares the same data, so updates are reflected everywhere instantly. |
| 🔐 | **Authentication** | Email/password sign-up and sign-in, plus **Google** and **GitHub OAuth** via Supabase Auth. Row-Level Security ensures every user sees only their own data. |
| 🤖 | **AI Suggestions** | Select any task and tap **"Get AI Suggestion"** — Google Gemini 1.5 Flash returns a smart, actionable breakdown in seconds. The backend is a lightweight Express server or Netlify Function. |
| 📝 | **Rich Text Editing** | Full-featured task details powered by **Quill.js** — bold, italic, lists, code blocks, images, and links. Save formatted notes directly on any task. |
| 📌 | **Task Templates** | Save any task as a reusable template. Apply a template to instantly pre-fill a new task with text, details, priority, and tags. Perfect for repetitive workflows. |
| 🎯 | **Goal Tracking** | Create goals with target dates and measurable metrics. Link tasks to goals and watch a **live progress bar** update as you complete linked work. |
| 📅 | **Calendar Integration** | FullCalendar-powered month view renders every task with a due date. Click any date to quickly add a task, or drag existing tasks to reschedule. |
| 🔄 | **Kanban Board** | Drag cards across **To Do → In Progress → Done**. Add tasks directly into any column. Column counts update in real time. |
| 🏷️ | **Priority & Due Dates** | Every task supports **Low / Medium / High** priority and an optional due date. Color-coded badges make priority levels scannable at a glance. |
| 👤 | **Profile Settings** | Update your display name and change your password from the settings panel. All profile changes sync immediately with Supabase. |
| 🎨 | **Notion-Style UI** | Collapsible left sidebar, **Inter** font family, subtle box shadows, and a clean gray/white color palette. It looks and feels like a familiar productivity workspace — no learning curve. |

---

## Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Kanban Board</strong></td>
      <td align="center"><strong>Calendar View</strong></td>
      <td align="center"><strong>AI Suggestions</strong></td>
    </tr>
    <tr>
      <td><img src="https://via.placeholder.com/320x200/eee/333?text=Kanban+Board" alt="Kanban Board" width="320"></td>
      <td><img src="https://via.placeholder.com/320x200/eee/333?text=Calendar+View" alt="Calendar View" width="320"></td>
      <td><img src="https://via.placeholder.com/320x200/eee/333?text=AI+Suggestions" alt="AI Suggestions" width="320"></td>
    </tr>
  </table>
</div>

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JS (ES6+) | Zero-dependency SPA with notion-inspired design |
| **Backend** | Node.js, Express.js | Lightweight server for AI suggestion proxy |
| **Database** | Supabase (PostgreSQL) | Data persistence, auth, Row-Level Security |
| **AI** | Google Gemini 1.5 Flash | Task breakdown and suggestion generation |
| **Rich Text** | Quill.js | WYSIWYG task details editor |
| **Calendar** | FullCalendar 6 | Interactive month-view calendar |
| **Drag & Drop** | SortableJS | Kanban column drag-and-drop |
| **Icons** | Boxicons | 1,500+ open-source icons |
| **Deployment** | Netlify | Static SPA hosting + serverless functions |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                         │
│  public/index.html  │  public/style.css  │  public/script.js │
└──────────┬──────────────────────────────┬───────────────────┘
           │  REST / JSON                 │  Static assets
           ▼                              ▼
┌─────────────────────┐       ┌──────────────────────────────┐
│  Netlify Functions   │       │  Express Server (optional)   │
│  netlify/functions/  │       │  server/index.js             │
│  └─ ai-suggestion    │       │  └─ POST /ai-suggestion      │
└──────────┬───────────┘       └──────────────┬───────────────┘
           │                                   │
           ▼                                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                      │
│  Auth ──► Email/Password, Google, GitHub OAuth               │
│  DB  ───► tasks, goals, templates (RLS per user_id)         │
│  SDK ───► @supabase/supabase-js                              │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              Google Gemini 1.5 Flash API                      │
│  POST https://generativelanguage.googleapis.com/v1beta/...    │
│  Returns structured task breakdowns (steps, resources, notes) │
└──────────────────────────────────────────────────────────────┘
```

**Data flow:**

1. The **static SPA** (HTML/CSS/JS) handles all UI rendering in the browser.
2. Auth and CRUD operations talk directly to **Supabase** via the client-side JS SDK.
3. AI suggestions go through a **backend proxy** (Express locally, Netlify Function in production) so the Gemini API key stays server-side.
4. Supabase **Row-Level Security** policies enforce that users can only read/write their own rows — the client never has unprotected database access.

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Supabase project | Free tier (any plan) |
| Gemini API key | Free tier via [Google AI Studio](https://aistudio.google.com) |

### 1. Clone

```bash
git clone https://github.com/Batu1-1an/Task-Manager.git
cd Task-Manager
```

### 2. Install

```bash
npm install
```

### 3. Environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
PORT=3000
```

### 4. Run

```bash
npm start
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> The frontend is entirely static and can be served from any web server. The Node.js server is only required for AI suggestion features.

---

## Supabase Schema

The app expects a Supabase project with the following tables and RLS policies.

### `tasks`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Auto-generated |
| `user_id` | `uuid` FK | References `auth.users` |
| `text` | `text` | Task title / description |
| `completed` | `boolean` | Completion status |
| `priority` | `text` | `low`, `medium`, or `high` |
| `due_date` | `date` | Optional due date |
| `details` | `text` | Rich-text content (HTML) |
| `status` | `text` | `todo`, `in_progress`, or `done` |
| `tags` | `text[]` | Array of tag strings |
| `subtasks` | `jsonb` | Array of subtask objects |
| `links` | `jsonb` | Array of link objects |
| `goal_id` | `uuid` FK | Links to `goals.id` |
| `created_at` | `timestamptz` | Auto-generated |

### `goals`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Auto-generated |
| `user_id` | `uuid` FK | References `auth.users` |
| `name` | `text` | Goal title |
| `description` | `text` | Optional description |
| `target_date` | `date` | Optional deadline |
| `metrics` | `text` | Success metric description |
| `completed` | `boolean` | Completion status |
| `created_at` | `timestamptz` | Auto-generated |

### `templates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` PK | Auto-generated |
| `user_id` | `uuid` FK | References `auth.users` |
| `name` | `text` | Template name |
| `task_data` | `jsonb` | Full task payload (text, priority, details, tags, etc.) |
| `created_at` | `timestamptz` | Auto-generated |

> **RLS:** Enable Row-Level Security on all three tables and create `USING (auth.uid() = user_id)` policies for SELECT, INSERT, UPDATE, and DELETE.

---

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/ai-suggestion` | `POST` | — | Sends a task description to Gemini and returns a structured breakdown |

### `POST /ai-suggestion`

**Request body:**
```json
{
  "taskText": "Plan team offsite for Q3"
}
```

**Response:**
```json
{
  "suggestion": "1. Define budget & timeline\n2. Research venues...\n3. ..."
}
```

---

## Project Structure

```
Task-Manager/
├── public/                      # Static SPA frontend
│   ├── index.html              # Main application layout (SPA shell)
│   ├── style.css               # Notion-inspired styles (Inter, shadows, grid)
│   └── script.js               # App logic (2,000+ lines)
├── server/                      # Express backend (AI proxy)
│   └── index.js                # POST /ai-suggestion handler
├── netlify/functions/          # Netlify serverless functions
│   └── ai-suggestion/          # Lambda-compatible AI endpoint
├── docs/                        # Planning & documentation
│   ├── PRD-Notion-Features.md
│   ├── auth_plan.md
│   ├── profile_settings_plan.md
│   ├── progress.md
│   ├── Checklist.md
│   └── user-profile-references.txt
├── netlify.toml                # Deployment configuration
├── package.json                # Dependencies & scripts
├── .env.example                # Environment variable template
├── .gitignore
└── README.md
```

---

## Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Batu1-1an/Task-Manager)

1. **Connect** your GitHub repository to Netlify.
2. **Build settings** (auto-detected from `netlify.toml`):
   - Build command: `npm install`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
3. **Environment variables** — add these in the Netlify dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. **Deploy** — Netlify builds and deploys automatically on every `git push`.

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

---

## License

<div align="center">
  <strong>MIT</strong> &copy; 2025 <a href="https://github.com/Batu1-1an">Batu1-1an</a>
  <br>
  <sub>Built with ❤️ for people who love getting things done.</sub>
</div>
