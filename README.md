# Grape Backend

A Node.js backend server built with Express.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd grape-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:
```bash
PORT=3000
```

## Running the Server

### Development mode
```bash
npm run dev
```
This will start the server with nodemon, which automatically restarts when you make changes.

### Production mode
```bash
npm start
```

## API Endpoints

- `GET /`: Welcome message
  - Response: `{ "message": "Welcome to Grape Backend API" }`

## Project Structure

- `server.js` - Main application entry point
- `.env` - Environment variables (create this file)
- `package.json` - Project metadata and dependencies

## Features

- Express.js server
- CORS enabled
- Environment variables support
- JSON body parsing
- URL-encoded body parsing
- Development mode with hot reload 