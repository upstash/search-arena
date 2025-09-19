# Search Arena

A powerful web application for comparing search results from different providers like Upstash, Algolia, and more. Run search battles to evaluate and compare the performance of different search engines with your queries.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenRouter API Key (for LLM evaluation, optional)
- Optional Upstash Redis credentials for rate limiting

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd search-arena
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/search_arena"

# OpenRouter (for LLM evaluation using Gemini 2.5 Flash, optional)
OPENROUTER_API_KEY="your-openrouter-api-key"

# Optional: Site configuration for OpenRouter
SITE_URL="http://localhost:3000"
SITE_NAME="Search Arena"
```

### 4. Database Setup

Run the database migrations:

```bash
pnpm drizzle-kit push
```

### 5. Start the development server

```bash
pnpm dev
```

## Usage

### Adding Search Providers

1. Click "Add Database" to configure a new search provider
2. Select your provider, currently only Upstash and Algolia are supported
3. Enter credentials in the .env format:

**For Upstash:**

```
UPSTASH_URL=your-upstash-url
UPSTASH_TOKEN=your-upstash-token
UPSTASH_INDEX=your-index-name
```

**For Algolia:**

```
ALGOLIA_APPLICATION_ID=your-app-id
ALGOLIA_API_KEY=your-api-key
ALGOLIA_INDEX=your-index-name
```

### Running Search Battles

1. Click "New Battle" to create a search comparison
2. Select two databases to compare
3. Add your search queries in the text area, one query per line
4. Run the battle
5. View and compare the results
