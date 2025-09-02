# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Bun monorepo with Turborepo build system containing a React frontend and Hono backend for the "IA para Devs" course. The project demonstrates API connectivity between frontend and backend with real-time health monitoring.

## Architecture

**Monorepo Structure:**

- `@frontend/app` - React + Vite frontend with Tailwind CSS and shadcn/ui components
- `@backend/api` - TypeScript Hono API server with CORS enabled
- Root workspace manages both packages with Bun workspaces and Turborepo orchestration

**Build System:**

- Turborepo manages task execution, dependencies, and caching
- Parallel task execution for improved development and build performance
- Intelligent caching of build outputs and task results
- Task pipeline optimization with dependency management

**Key Integration:**

- Frontend polls backend `/health` endpoint every 5 seconds
- Live API status indicator in UI (green/red/yellow dot)
- Frontend expects backend on `http://localhost:3005`

## Development Commands

**Start Development:**

```bash
bun run dev           # Start both frontend and backend (Turborepo parallel execution)
bun run dev:frontend  # Frontend only (Vite dev server)
bun run dev:backend   # Backend only (Bun watch mode)
```

**Build:**

```bash
bun run build         # Build both packages (Turborepo with caching and dependencies)
bun run build:frontend # Frontend build (Vite)
bun run build:backend  # Backend build (TypeScript compiler)
```

**Code Quality:**

```bash
bun run lint          # Lint all packages (Turborepo parallel execution)
bun run format        # Format all files with Prettier (Turborepo parallel)
bun run format:check  # Check formatting without changes (Turborepo parallel)
bun run test          # Run tests in all packages (when configured)
```

**Turborepo Specific:**

```bash
turbo run dev         # Same as bun run dev, with Turborepo task orchestration
turbo run build --cache-dir=.turbo  # Build with custom cache directory
turbo run lint --parallel           # Force parallel execution
turbo prune --scope=frontend        # Create filtered workspace
```

## Technology Stack

**Frontend (`@frontend/app`):**

- React 19.1.1 + Vite 7.1.3
- Tailwind CSS 4.1.12 with shadcn/ui components and `@tailwindcss/vite` plugin
- ESLint + Prettier for code quality
- Path alias: `@/` → `./src/`

**Backend (`@backend/api`):**

- Hono 4.8.1 + TypeScript 5.9.2
- CORS enabled for cross-origin requests
- @hono/node-server for Node.js runtime
- Bun watch mode for development hot reload
- Strict TypeScript configuration

**Build System:**

- Turborepo 2.5.6 for monorepo task orchestration
- Intelligent task caching and dependency management
- Parallel execution of independent tasks
- Package manager: Bun 1.2.19 (required for Turborepo)

## File Structure Conventions

- Frontend components use `.jsx` extension
- Backend uses `.ts` extension with strict TypeScript
- VS Code workspace configured for auto-formatting and extension recommendations
- Tailwind CSS v4 with CSS-first configuration using `@theme` directive for shadcn/ui theming
- Uses `@import 'tailwindcss'` instead of traditional `@tailwind` directives

## Development Notes

**Server Configuration:**

- Backend runs on port 3005 (configurable via PORT env var)
- Frontend development server runs on port 5173 (Vite default)
- Health check endpoint: `GET /health` returns status and timestamp
- No authentication or database setup in base configuration

**Tailwind CSS v4:**

- CSS-first config, `@tailwindcss/vite` plugin, built-in import support
- shadcn/ui theme preserved with `@theme` directive and CSS variables
- Uses `@import 'tailwindcss'` instead of traditional `@tailwind` directives

**Turborepo Configuration:**

- `turbo.json` defines task pipelines and caching strategies
- `.turbo/` directory contains build cache (gitignored)
- Tasks run with dependency resolution (builds before tests)
- Persistent tasks (dev servers) marked with `"persistent": true`
- Formatting tasks disable caching with `"cache": false`
