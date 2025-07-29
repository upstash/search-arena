# Search Arena

A powerful web application for comparing search results from different providers like Upstash, Algolia, and more. Run search battles to evaluate and compare the performance of different search engines with your queries.

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database
- Google API Key (for AI features)

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

# Google AI
GOOGLE_API_KEY="your-google-api-key"
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
2. Select your provider (Upstash, Algolia, etc.)
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
3. Add your search queries
4. Run the battle to see comparative results
5. View detailed results in the sortable data table

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                 # Utility functions and configurations
├── server/              # tRPC server and database logic
└── types/               # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary.
