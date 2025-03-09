# HMA Review Tool

A review tool for the Hasher-Matcher-Actioner system that allows human moderators to review content flagged by automated hash matching.

## Overview

The HMA Review Tool provides:

- A dashboard to monitor review queues across different content categories
- A review interface for making moderation decisions
- Support for multiple hash algorithms (PDQ, MD5, SHA1)
- Queue management with Redis for efficient task distribution

## Project Structure

- `/frontend`: Next.js frontend application with Chakra UI
- `/backend`: FastAPI backend application

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Docker and Docker Compose (for Redis)

### Setting Up the Development Environment

1. **Start Redis using Docker Compose**:

```bash
cd hasher-matcher-actioner/review-tool
docker-compose up -d
```

2. **Set up the backend**:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

3. **Set up the frontend**:

```bash
cd frontend
npm install
npm run dev
```

4. **Seed test data**:

```bash
cd backend
python seed_test_data.py
```

## Testing the System

1. **Check the dashboard**:
   - Open http://localhost:3000/dashboard to view queue statistics

2. **Review content**:
   - Open http://localhost:3000/review to start reviewing content
   - You can filter by content category, hash algorithm, and confidence level

3. **Clear test data**:

```bash
cd backend
python seed_test_data.py --clear
```

## API Documentation

When the backend is running, the API documentation is available at:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## Features

### Dashboard

- Shows queue statistics grouped by content category
- Displays the number of pending, active, and completed tasks
- Shows the age of the oldest task in each queue
- Provides filtering options for hash algorithms and confidence levels

### Review Interface

- Displays the current image to review
- Shows hash information and potential matches
- Provides actions for approving, rejecting, escalating, or skipping content
- Supports adding notes to review decisions 