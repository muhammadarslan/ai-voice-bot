# PostgreSQL Setup Guide

## Local Development Setup

### Option 1: Install PostgreSQL locally (macOS)

```bash
# Install PostgreSQL using Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create the voice_bot database
createdb voice_bot

# Connect to verify setup
psql voice_bot
```

### Option 2: Using Docker (when Docker is available)

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Check if container is running
docker-compose ps

# Connect to database
docker-compose exec postgres psql -U postgres -d voice_bot
```

## Environment Configuration

Update your `.env` file with PostgreSQL settings:

```env
# PostgreSQL Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=voice_bot
```

## Testing the Connection

```bash
# Start the application
npm run start:dev

# The application will automatically create tables using TypeORM synchronize
```

## Production Considerations

- Set `synchronize: false` in production
- Use migrations for schema changes
- Configure SSL connections
- Set up connection pooling
- Regular database backups
