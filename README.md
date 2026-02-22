# SnippetBox

A modern, self-hosted code snippet manager for developers. Save, organize, search, and share code snippets with syntax highlighting, tags, and collections.

## Features

- 📝 **Snippet Management**: Create, edit, delete code snippets
- 🏷️ **Tag System**: Organize snippets with tags
- 📁 **Collections**: Group snippets into folders
- 🔍 **Full-text Search**: Search across titles, descriptions, and code
- 🎨 **Syntax Highlighting**: Support for 20+ programming languages
- 🌓 **Dark/Light Theme**: Comfortable viewing in any environment
- 📊 **Dashboard**: Statistics and insights about your snippets
- 📤 **Import/Export**: Backup and migrate your data

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Syntax Highlighting**: Prism.js

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hikmetgulsesli/snippetbox.git
cd snippetbox
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
cp server/.env.example server/.env
# Edit server/.env with your database credentials
npm run db:migrate
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3512

## Development

### Project Structure

```
snippetbox/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── package.json
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── database/
│   │   └── ...
│   └── package.json
└── package.json     # Root workspace config
```

### Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm run test` - Run all tests
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations

## License

MIT
