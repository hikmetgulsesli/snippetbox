# SnippetBox - Code Snippet Manager

## Overview
A modern, self-hosted code snippet manager for developers. Save, organize, search, and share code snippets with syntax highlighting, tags, and collections.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (existing server: localhost, user=setrox, db=snippetbox, pass=k7z6*n4u4)
- **Syntax Highlighting:** Prism.js or Highlight.js
- **Port:** 3512

## User Stories

### US-001: Project Setup & Base Architecture
**As a** developer
**I want** the project scaffolded with React + Express + PostgreSQL
**So that** development can begin on a solid foundation

**Acceptance Criteria:**
- Monorepo structure: `client/` (React+Vite) and `server/` (Express+TS)
- PostgreSQL connection with migrations
- Database tables: snippets, tags, snippet_tags, collections
- Dev scripts: `npm run dev` starts both client and server
- ESLint + TypeScript configured
- Tailwind CSS with dark mode support
- Base layout with sidebar navigation

### US-002: Snippet CRUD Operations
**As a** user
**I want** to create, read, update, and delete code snippets
**So that** I can manage my code collection

**Acceptance Criteria:**
- Create snippet with: title, description, code, language, collection (optional)
- Edit existing snippets inline
- Delete with confirmation dialog
- List view with snippet preview (first 3 lines)
- Detail view with full code and metadata
- Auto-detect language from code content
- Copy-to-clipboard button on each snippet
- REST API: POST/GET/PUT/DELETE /api/snippets

### US-003: Syntax Highlighting & Code Editor
**As a** user
**I want** syntax highlighting for 20+ programming languages
**So that** code is readable and visually distinct

**Acceptance Criteria:**
- Syntax highlighting for: JavaScript, TypeScript, Python, Go, Rust, Java, C/C++, SQL, HTML, CSS, JSON, YAML, Bash, Markdown, PHP, Ruby, Swift, Kotlin, Dart, Docker
- Code editor with line numbers for input
- Language selector dropdown
- Theme: dark background (VS Code style)
- Responsive code blocks that handle long lines

### US-004: Tag System
**As a** user
**I want** to tag snippets and filter by tags
**So that** I can organize and find related code

**Acceptance Criteria:**
- Add multiple tags to each snippet
- Tag autocomplete from existing tags
- Filter snippets by one or more tags
- Tag cloud/list in sidebar showing tag counts
- Create/delete tags
- Color-coded tags
- REST API: GET /api/tags, POST/DELETE /api/snippets/:id/tags

### US-005: Search & Filter
**As a** user
**I want** to search across all my snippets
**So that** I can quickly find the code I need

**Acceptance Criteria:**
- Full-text search across title, description, and code content
- Filter by language
- Filter by collection
- Filter by tags (combinable)
- Sort by: date created, date modified, title, language
- Search results highlight matching text
- Debounced search input (300ms)
- REST API: GET /api/snippets?q=&language=&tag=&sort=

### US-006: Collections (Folders)
**As a** user
**I want** to organize snippets into collections
**So that** I can group related snippets together

**Acceptance Criteria:**
- Create, rename, delete collections
- Move snippets between collections
- Sidebar shows collections with snippet counts
- "All Snippets" and "Uncategorized" default views
- Collection detail page showing its snippets
- Drag-and-drop to move snippets (optional)
- REST API: CRUD /api/collections

### US-007: Import & Export
**As a** user
**I want** to import and export snippets
**So that** I can backup and migrate my data

**Acceptance Criteria:**
- Export all snippets as JSON file
- Export single snippet as file (with proper extension)
- Import from JSON file
- Import from GitHub Gist URL
- Bulk export selected snippets
- REST API: POST /api/import, GET /api/export

### US-008: Dashboard & Statistics
**As a** user
**I want** a dashboard showing my snippet statistics
**So that** I can see my collection at a glance

**Acceptance Criteria:**
- Total snippet count
- Snippets by language (bar chart)
- Recent snippets (last 10)
- Most used tags
- Collection sizes
- Snippets added over time (line chart)
- Quick-add snippet button on dashboard

### US-009: Dark/Light Theme & Responsive UI
**As a** user
**I want** a polished, responsive UI with theme support
**So that** the app is comfortable to use on any device

**Acceptance Criteria:**
- Dark mode by default, toggle to light
- Responsive layout: desktop sidebar collapses on mobile
- Clean typography with monospace for code
- Smooth transitions and hover states
- Loading skeletons for async content
- Toast notifications for actions
- Keyboard shortcuts: Ctrl+N (new), Ctrl+K (search), Ctrl+S (save)

### US-010: Snippet Sharing & Public Links
**As a** user
**I want** to share individual snippets via public links
**So that** I can share code with others

**Acceptance Criteria:**
- Generate shareable public URL for a snippet
- Public view page (no auth required) with syntax highlighting
- Toggle snippet visibility: private/public
- Copy share link button
- Public snippets accessible at /s/:shareId
- Rate limiting on public endpoints
