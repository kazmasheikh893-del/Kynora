# Kynora – Technology Stack

> **AI Email Analyzer & Productivity Platform**

---

# Overview

Kynora is built using a modern, scalable, and industry-standard technology stack. The selected technologies prioritize performance, security, maintainability, developer experience, and future scalability.

The architecture follows a **Frontend → Backend → Database → AI Services** approach, where each layer is responsible for a specific part of the application. This modular design makes the platform easier to develop, test, maintain, and expand over time.

One of Kynora's primary goals is to remain **AI provider-independent**, allowing different AI models to be integrated without requiring major architectural changes.

---

# Technology Stack Overview

## Frontend

- React.js (v18+)
- TypeScript
- Vite
- Tailwind CSS

---

## Backend

- Python (v3.11+)
- FastAPI
- Uvicorn
- Pydantic (v2)

---

## Database

- MySQL
- SQLAlchemy ORM & MySQL Connector/Python
- MySQL Workbench for administration

---

## Machine Learning & Text Processing

- Scikit-learn (Supervised: Logistic Regression, KNN, Random Forest, Decision Tree; Unsupervised: K-Means)
- Scikit-learn TfidfVectorizer
- Pandas & NumPy
- Joblib (Model persistence)
- Matplotlib (Experiment visualization)

---

## Email Integration & Authentication

- Gmail API
- Google OAuth 2.0 (Scope: `https://www.googleapis.com/auth/gmail.readonly`)

---

## Artificial Intelligence

- OpenAI API *(Initial Provider)*
- Provider-independent AI Architecture

Future AI Providers:

- Google Gemini
- Anthropic Claude
- Ollama (Local Models)

---

## Email Integration

- Gmail API

Future Integrations:

- Microsoft Outlook
- IMAP
- Exchange

---

## Development Tools

- Git
- GitHub
- Visual Studio Code
- Postman

---

## Deployment

Frontend

- Vercel

Backend

- Render

Database

- Supabase PostgreSQL
- Neon PostgreSQL (Alternative)

---

# Frontend Technologies

The frontend represents everything users interact with directly, including authentication pages, dashboards, email lists, AI summaries, settings, analytics, and notifications.

The frontend of Kynora is designed with responsiveness, performance, and maintainability as the primary objectives.

---

## React.js

React.js serves as the foundation of Kynora's user interface.

Rather than building the application as one large page, React enables development through reusable components that can be independently developed, tested, and maintained.

Examples of reusable components include:

- Navigation Bar
- Sidebar
- Email Card
- Dashboard Widgets
- AI Summary Panel
- Reply Suggestion Card
- Analytics Charts
- Notification Panel
- Settings Forms
- Profile Components

### Why React?

- Component-based architecture
- Virtual DOM for high performance
- Excellent ecosystem
- Strong community support
- Easy integration with APIs
- Widely adopted in modern SaaS products

### Responsibilities in Kynora

React is responsible for:

- Rendering the user interface
- Managing page navigation
- Displaying emails
- Displaying AI-generated summaries
- Showing analytics dashboards
- Managing user interactions
- Connecting to backend APIs

---

## TypeScript

TypeScript extends JavaScript by introducing static typing.

As Kynora grows into a larger project, TypeScript helps reduce bugs and improves maintainability by detecting errors during development rather than at runtime.

### Why TypeScript?

- Type safety
- Better IntelliSense
- Easier debugging
- Improved code readability
- Faster development
- Easier refactoring

### Responsibilities in Kynora

TypeScript is used to:

- Define application models
- Validate object structures
- Improve API reliability
- Prevent runtime errors
- Maintain consistent code quality

---

## Vite

Vite is the build tool used for the frontend.

It provides an extremely fast development environment with instant hot reloading while generating optimized production builds.

### Why Vite?

- Fast startup
- Instant Hot Module Replacement (HMR)
- Optimized builds
- Minimal configuration
- Better developer experience

### Responsibilities in Kynora

Vite is responsible for:

- Starting the development server
- Building the production application
- Managing frontend assets
- Optimizing JavaScript and CSS bundles

---

# UI & Styling

Kynora follows a clean, minimal, and productivity-focused design language.

The interface is designed to reduce cognitive load while making important information easy to discover.

---

## Tailwind CSS

Tailwind CSS is the primary styling framework used throughout Kynora.

Instead of writing large CSS files, Tailwind provides utility classes that allow interfaces to be built rapidly while maintaining consistency.

### Why Tailwind CSS?

- Utility-first approach
- Responsive by default
- Highly customizable
- Faster UI development
- Smaller CSS footprint

### Responsibilities in Kynora

Tailwind is responsible for:

- Layout design
- Responsive design
- Typography
- Colors
- Spacing
- Animations
- Component styling

---

## shadcn/ui

shadcn/ui provides production-ready React components built on top of Radix UI.

Instead of creating every interface element from scratch, Kynora uses these accessible and customizable components to accelerate development.

### Components Used

- Button
- Card
- Dialog
- Dropdown Menu
- Input
- Table
- Toast
- Tabs
- Badge
- Avatar
- Popover
- Calendar

### Why shadcn/ui?

- Modern appearance
- Accessibility support
- Easy customization
- Lightweight
- Excellent integration with Tailwind CSS

---

# Backend Technologies

The backend acts as the central processing layer of Kynora.

It is responsible for handling authentication, communicating with the database, processing AI requests, interacting with Gmail, validating requests, and serving data to the frontend.

The backend follows a RESTful API architecture and is designed to remain modular for future expansion.

---

## Node.js

Node.js provides the runtime environment for Kynora's backend.

It allows JavaScript and TypeScript to execute outside the browser, making it possible to build server-side applications using the same language as the frontend.

### Why Node.js?

- High performance
- Event-driven architecture
- Non-blocking I/O
- Large package ecosystem
- Excellent scalability

### Responsibilities in Kynora

Node.js is responsible for:

- Running backend services
- Processing API requests
- Executing AI workflows
- Communicating with Gmail
- Handling authentication
- Managing server operations

---

## Express.js

Express.js is the web framework used to build Kynora's REST API.

It provides a structured way to create routes, middleware, controllers, and request handlers.

### Why Express.js?

- Lightweight
- Flexible
- Fast
- Easy middleware integration
- Excellent community support

### Responsibilities in Kynora

Express manages:

- Authentication routes
- User routes
- Email APIs
- AI APIs
- Dashboard APIs
- Notification APIs
- Error handling
- Request validation

# Database Technologies

The database is responsible for storing and managing all persistent data used by Kynora. Rather than storing email content permanently, Kynora primarily stores user information, application settings, AI-generated metadata, analytics, and other data required to provide a personalized and efficient user experience.

The database layer is designed to be secure, scalable, and optimized for future growth.

---

## PostgreSQL

PostgreSQL is the primary relational database management system used by Kynora.

It provides a reliable and structured way to store application data while maintaining data integrity through relational tables and constraints.

### Why PostgreSQL?

- Open-source and free
- Highly reliable and stable
- Excellent performance
- ACID-compliant transactions
- Supports complex queries
- Widely used in production SaaS applications

### Responsibilities in Kynora

PostgreSQL stores:

- User accounts
- Authentication information
- Connected email accounts
- Email metadata
- AI analysis history
- Notification records
- Dashboard statistics
- User preferences
- Application settings
- Activity logs

### Future Expansion

As Kynora grows, PostgreSQL can easily support:

- Team workspaces
- Shared inboxes
- Calendar integration
- AI memory
- Organization management
- Enterprise accounts

---

## Prisma ORM

Prisma ORM acts as the communication layer between the backend and PostgreSQL.

Instead of writing raw SQL queries throughout the project, Prisma provides a modern and type-safe interface for interacting with the database.

### Why Prisma?

- Type-safe database queries
- Automatic schema generation
- Easy migrations
- Excellent developer experience
- Reduces SQL-related errors
- Improves maintainability

### Responsibilities in Kynora

Prisma is responsible for:

- Reading database records
- Creating new records
- Updating existing data
- Deleting records
- Managing database relationships
- Running database migrations

---

# Authentication & Security

Security is one of the core principles of Kynora.

Since the platform handles user accounts and access to personal email data, authentication and authorization must be implemented using industry-standard security practices.

---

## JSON Web Token (JWT)

JWT is used to authenticate users after they successfully log in.

Instead of requiring users to log in before every request, the server issues a secure token that verifies their identity for future requests.

### Why JWT?

- Stateless authentication
- Fast verification
- Scalable architecture
- Secure API communication
- Industry standard

### Responsibilities in Kynora

JWT is used for:

- User authentication
- Protecting API endpoints
- Session management
- User authorization
- Secure communication between frontend and backend

---

## Google OAuth 2.0

Google OAuth allows users to securely connect their Gmail accounts without sharing their passwords with Kynora.

The authentication process is handled entirely by Google.

### Why Google OAuth?

- Secure authentication
- Trusted login experience
- Easy Gmail integration
- Reduced password management
- Industry standard

### Responsibilities in Kynora

Google OAuth is responsible for:

- Gmail account authorization
- Secure account connection
- Permission management
- Access token generation
- Email synchronization authorization

---

## bcrypt

Passwords should never be stored as plain text.

bcrypt is used to hash user passwords before they are stored in the database.

### Why bcrypt?

- Industry-standard password hashing
- Strong security
- Resistant to brute-force attacks
- Salt generation
- Reliable and widely adopted

### Responsibilities in Kynora

bcrypt is responsible for:

- Password hashing
- Password verification during login
- Secure credential storage

---

# Artificial Intelligence

Artificial Intelligence is the core technology behind Kynora.

Instead of functioning as a traditional email client, Kynora enhances email productivity by analyzing email content and providing intelligent assistance.

The AI layer is intentionally designed to remain independent of any single AI provider, allowing future integration with different language models.

---

## OpenAI API

OpenAI serves as the initial AI provider for Kynora.

It powers the platform's intelligent email analysis features.

### AI Features

- Email Summarization
- Smart Reply Generation
- Priority Detection
- Email Categorization
- Sentiment Analysis
- Action Item Extraction
- Deadline Detection
- Keyword Extraction

### Why OpenAI?

- Excellent natural language understanding
- High-quality summaries
- Strong reasoning capabilities
- Reliable API
- Comprehensive documentation

### Responsibilities in Kynora

The AI service is responsible for:

- Processing email content
- Generating summaries
- Suggesting replies
- Extracting tasks
- Detecting deadlines
- Classifying emails
- Improving productivity

---

## Provider-Independent AI Architecture

Although OpenAI is the initial provider, Kynora is designed so that different AI providers can be integrated with minimal changes.

Potential providers include:

- Google Gemini
- Anthropic Claude
- Ollama (Local Models)
- Future AI services

This modular approach ensures flexibility, reduces vendor lock-in, and allows Kynora to adapt as AI technologies evolve.

---

# Email Integration

## Gmail API

The Gmail API enables Kynora to securely access a user's inbox after obtaining explicit permission through Google OAuth.

Kynora does not ask users for their Gmail passwords.

### Why Gmail API?

- Official Google service
- Secure OAuth integration
- Reliable synchronization
- Rich email metadata
- Production-ready

### Responsibilities in Kynora

The Gmail API is used to:

- Fetch emails
- Read email content
- Retrieve sender information
- Read labels
- Access attachment metadata
- Synchronize inbox updates

### Future Integrations

Future versions of Kynora may support:

- Microsoft Outlook
- IMAP
- Exchange
- Multiple email providers

---

# State Management

## Zustand

As Kynora grows, many parts of the interface need access to shared application data.

Zustand provides a lightweight and efficient solution for managing global application state.

### Why Zustand?

- Simple API
- Lightweight
- Excellent performance
- Minimal boilerplate
- Easy learning curve

### Responsibilities in Kynora

Zustand manages:

- Logged-in user
- Current email
- Theme settings
- Dashboard state
- Notifications
- User preferences

---

# API Communication

## Axios

Axios is used by the frontend to communicate with the backend APIs.

It simplifies sending HTTP requests and handling responses.

### Responsibilities in Kynora

Axios is responsible for:

- User authentication requests
- Email retrieval
- Dashboard data
- AI requests
- Settings updates
- Notification APIs

---

# Validation

## Zod

Zod provides schema validation for forms, requests, and responses.

It helps ensure that only valid data enters the application.

### Why Zod?

- Type-safe validation
- Excellent TypeScript integration
- Reliable error handling
- Simple syntax

### Responsibilities in Kynora

Zod validates:

- Registration forms
- Login forms
- API requests
- API responses
- User settings

---

# Data Visualization

## Recharts

Recharts is the charting library used for Kynora's analytics dashboard.

It transforms application data into meaningful visual insights.

### Responsibilities in Kynora

Recharts is used to display:

- Email activity
- Priority distribution
- Category breakdown
- Productivity analytics
- Weekly reports
- Monthly trends


# Development Tools

A well-structured development environment ensures code quality, efficient collaboration, and maintainability throughout the project lifecycle.

---

## Git

Git is the version control system used to track changes in the project.

### Responsibilities

- Track code changes
- Manage branches
- Merge new features
- Maintain project history
- Enable team collaboration

---

## GitHub

GitHub serves as the central repository for the Kynora project.

### Responsibilities

- Source code hosting
- Documentation management
- Issue tracking
- Pull requests
- Version management
- Collaboration
- Project planning

---

## Visual Studio Code

Visual Studio Code is the primary Integrated Development Environment (IDE) used for development.

### Recommended Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- GitLens
- Error Lens
- Thunder Client *(Optional)*

---

## API Testing

During development, APIs are tested before frontend integration.

Recommended tools:

- Postman
- Thunder Client (VS Code Extension)

These tools help verify API functionality, validate responses, and simplify debugging.

---

# Deployment Strategy

Kynora follows a distributed deployment model where each major component is deployed independently.

This architecture improves scalability, simplifies maintenance, and allows each service to be updated without affecting the others.

---

## Frontend

**Platform:** Vercel

### Why Vercel?

- Fast deployment
- Automatic HTTPS
- Global CDN
- GitHub integration
- Preview deployments
- Optimized for React applications

---

## Backend

**Platform:** Render

### Why Render?

- Easy deployment
- Automatic builds
- Environment variable management
- Reliable hosting
- Suitable for Node.js applications

---

## Database

**Primary Choice:** Supabase PostgreSQL

**Alternative:** Neon PostgreSQL

### Why?

- Managed PostgreSQL
- Free development tier
- Automatic backups
- Secure connections
- Easy scalability

---

# Project Structure

Kynora follows a modular architecture to improve maintainability and future expansion.

## Frontend Structure

```
frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── types/
│   ├── utils/
│   ├── assets/
│   └── styles/
│
└── public/
```

---

## Backend Structure

```
backend/
│
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── ai/
│   ├── email/
│   ├── auth/
│   ├── database/
│   ├── config/
│   ├── utils/
│   └── server.ts
│
├── prisma/
└── package.json
```

---

# Environment Variables

Sensitive information should never be stored directly in the source code.

Configuration values are stored using environment variables.

Examples include:

- Database URL
- JWT Secret
- Google OAuth Credentials
- Gmail API Credentials
- OpenAI API Key
- Application Port

This approach improves both security and deployment flexibility.

---

# Technology Selection Principles

The Kynora technology stack was selected using the following principles:

## Modern Technologies

Use widely adopted and actively maintained technologies.

---

## Scalability

Choose technologies capable of supporting future platform growth.

---

## Maintainability

Keep the project modular, readable, and easy to extend.

---

## Security

Follow industry-standard authentication and security practices.

---

## Performance

Ensure fast loading times and efficient server performance.

---

## Developer Experience

Use tools that improve productivity, debugging, and code quality.

---

## Open Source Preference

Whenever possible, prefer open-source technologies to reduce costs and encourage community support.

---

# Future Scalability

The MVP intentionally focuses on a lightweight architecture.

As Kynora evolves, the following technologies may be introduced:

## Infrastructure

- Docker
- Kubernetes
- Nginx

---

## Performance

- Redis
- RabbitMQ
- CDN Optimization

---

## Search

- Elasticsearch

---

## AI

- LangChain
- Vector Databases
- Retrieval-Augmented Generation (RAG)
- AI Agents
- Local LLM Support

---

## Monitoring

- Prometheus
- Grafana
- Sentry

These technologies are **not part of the MVP**, but they provide a roadmap for scaling Kynora into a production-grade SaaS platform.

---

# Technology Selection Summary

### Frontend

- React.js
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand
- Axios
- Recharts

---

### Backend

- Node.js
- Express.js

---

### Database

- PostgreSQL
- Prisma ORM

---

### Authentication

- JWT
- Google OAuth 2.0
- bcrypt

---

### Artificial Intelligence

- OpenAI API *(Initial Provider)*
- Provider-independent AI Architecture

---

### Email Integration

- Gmail API

---

### Development

- Git
- GitHub
- Visual Studio Code
- Postman

---

### Deployment

- Vercel
- Render
- Supabase PostgreSQL
- Neon PostgreSQL *(Alternative)*

---

# Conclusion

The Kynora technology stack has been carefully selected to balance simplicity, scalability, security, and long-term maintainability.

Every technology included in this document serves a specific purpose within the platform and has been chosen based on industry best practices, strong community support, and compatibility with modern SaaS development.

This stack enables Kynora to begin as a powerful AI Email Analyzer & Productivity Platform while providing a solid technical foundation for future expansion into a comprehensive AI-powered productivity ecosystem.


