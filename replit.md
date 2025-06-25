# Know Yourself - Self-Reflection Tool

## Overview

Know Yourself is a web application designed to guide students and young individuals through deep self-reflection using Ivy League-inspired essay prompts. The app provides a structured journey through introspective questions, offering AI-powered psychological insights based on user responses. Built with a modern full-stack architecture, it combines thoughtful UX design with robust data persistence and AI analysis capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript throughout the stack
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Replit Auth integration with OpenID Connect
- **AI Integration**: Google Gemini AI for psychological analysis
- **API Design**: RESTful endpoints with consistent error handling

### Database Architecture
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Connection**: Connection pooling with @neondatabase/serverless
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- **Provider**: Replit Auth with OIDC (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Automatic user creation/updates on login
- **Security**: HTTP-only cookies with secure settings

### Data Models
- **Users**: Core user profile with Replit integration
- **Reflections**: Question responses with auto-save functionality
- **Analysis**: AI-generated psychological insights
- **Final Learnings**: User-written reflections on their insights

### Question System
- **10 Themed Questions**: Identity, Challenge, Beliefs, Gratitude, Problem-solving, Learning, Community, Intellectual curiosity, Meaningful moments, Growth
- **Progressive Navigation**: Breadcrumb-based navigation with flexible order
- **Auto-save**: Real-time response persistence
- **State Tracking**: Progress indicators and completion status

### AI Analysis Engine
- **Provider**: Google Gemini 2.5 Pro
- **Input**: All user reflections combined
- **Output**: 7-10 structured psychological discoveries
- **Format**: JSON array with bold concepts and explanations
- **Error Handling**: Graceful fallbacks and user feedback

## Data Flow

1. **Authentication Flow**:
   - User redirects to Replit Auth
   - OIDC token validation and user creation/update
   - Session establishment with PostgreSQL storage

2. **Reflection Flow**:
   - Question display with guidance text
   - Real-time auto-save of responses
   - Progress tracking across all questions
   - Flexible navigation between questions

3. **Analysis Flow**:
   - User triggers AI analysis after completing reflections
   - All responses sent to Gemini API
   - Psychological insights generated and stored
   - Results displayed with visual formatting

4. **Final Learning Flow**:
   - User writes personal reflections on AI insights
   - Auto-save functionality for continuous drafting
   - Persistent storage for future reference

## External Dependencies

### Core Dependencies
- **@google/genai**: Gemini AI integration
- **@neondatabase/serverless**: PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight routing

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **drizzle-kit**: Database schema management
- **esbuild**: Server-side bundling

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20
- **Database**: PostgreSQL 16 module
- **Hot Reload**: Vite dev server with HMR
- **Command**: `npm run dev` starts both client and server

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code
- **Assets**: Served from dist/public directory
- **Command**: `npm run build` creates production artifacts

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **GEMINI_API_KEY**: Google AI API credentials
- **SESSION_SECRET**: Session encryption key
- **REPLIT_DOMAINS**: Authentication domain configuration

### Scaling Strategy
- **Deployment Target**: Autoscale on Replit
- **Database**: Neon serverless handles connection scaling
- **Session Storage**: PostgreSQL for persistent sessions
- **Static Assets**: Efficient serving with proper caching

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 25, 2025. Initial setup