# Personal Finance Agent Demo

This folder contains the complete Google ADK TypeScript implementation of a multi-turn personal finance agent with both in-memory and server-based execution modes.

## 🚀 Quick Start

### Option 1: In-Memory Simulation (Recommended for Testing)

```bash
# From the demo folder
cd demo

# Set your API key
export GOOGLE_GENAI_API_KEY="your-api-key-here"

# Run the in-memory conversation demo
bun run demo
```

### Option 2: Server-Based Chat (Production-Ready)

```bash
# Run server and simulation automatically
bun run demo-server-auto

# OR run server manually in one terminal
bun run serve

# Then run simulation in another terminal
bun run demo-server
```

## 📁 Files Overview

### ADK Devtools (Developer UI)

This project integrates with **Google ADK Devtools** for an interactive developer UI to inspect agent runs, tools, and state.

To open the Devtools UI:

```bash
# From demo/ folder
bun run dev
# or
npx @google/adk-devtools run demo/agent.ts
```

The Devtools web UI will start on a local port (check terminal output). You can then open the UI in your browser and use it to step through agent runs, inspect tool calls, and debug session state.

If you're running the demo server concurrently, you can open the Devtools UI in a separate terminal using the same command.

### Core Implementation
- `agent.ts` - Main agent implementation with finance tools
- `server.ts` - Hono server wrapper for HTTP-based chat

### Simulation Scripts
- `simulate-conversation.ts` - In-memory 5-turn conversation demo
- `simulate-server-conversation.ts` - Server-based 5-turn conversation demo

### Configuration
- `.env` - Environment configuration
- `package.json` - Scripts and dependencies

## 🎯 Features Demonstrated

- ✅ **Multi-turn conversations** with persistent session management
- ✅ **Function tools** for transaction analysis and budget management
- ✅ **Real-time streaming** responses (SSE mode)
- ✅ **Google ADK integration** with Gemini 2.5 Flash
- ✅ **TypeScript implementation** with Zod validation
- ✅ **HTTP server** with Hono for production deployment
- ✅ **Session persistence** across multiple HTTP requests

## 📊 Conversation Flow

The demo simulates a 5-turn conversation where the agent:
1. **Turn 1**: Analyzes spending transactions using `analyze_transactions` tool
2. **Turn 2**: Recalls previous analysis to answer follow-up questions
3. **Turn 3**: Sets budget goals using `set_budget_goal` tool
4. **Turn 4**: Calculates budget status using `calculate_budget_status` tool
5. **Turn 5**: Generates comprehensive report using all stored session data

## 🔧 Configuration

### Required Environment Variables

```bash
export GOOGLE_GENAI_API_KEY="your-api-key-here"
```

Get your API key from: https://ai.google.dev/

### Optional Environment Variables

```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
```

## 🌐 Server-Based Chat

### API Endpoint

**POST** `/chat`

**Request Body:**
```json
{
  "message": "Please analyze my transactions...",
  "userId": "user-123",
  "sessionId": "session-abc"
}
```

**Response:**
- Streaming text response (Server-Sent Events)
- Real-time agent responses as they're generated

### Session Management

The server implements **persistent session management** to maintain conversation context across multiple requests:

```typescript
// ✅ CORRECT: Check if session exists before creating
let session;
try {
  // Try to get existing session first
  session = await globalRunner.sessionService.getSession({
    appName,
    userId,
    sessionId,
  });
  console.log(`✅ Using existing session: ${session.id}`);
} catch (error) {
  // Session doesn't exist, create a new one
  session = await globalRunner.sessionService.createSession({
    appName,
    userId,
    sessionId,
    state: {},
  });
  console.log(`📝 Creating new session: ${session.id}`);
}
```

### ⚠️ Critical: Session Persistence Bug

**IMPORTANT**: Do NOT recreate sessions on every request!

```typescript
// ❌ WRONG: This will lose all conversation history!
const session = await globalRunner.sessionService.createSession({
  appName,
  userId,
  sessionId,
  state: {},
});
```

**Why this is wrong:**
- `createSession()` overwrites any existing session with the same ID
- All conversation history and context is lost
- The agent won't remember previous turns
- Multi-turn conversations will fail

**The fix:**
- Always call `getSession()` first to check if session exists
- Only call `createSession()` if the session doesn't exist
- This preserves conversation history across HTTP requests

## 📦 Available Scripts

```bash
# In-memory simulation
bun run demo                    # Run in-memory conversation demo

# Server-based simulation
bun run serve                   # Start Hono server on port 3000
bun run demo-server             # Run server simulation (requires server running)
bun run demo-server-auto        # Start server + run simulation automatically

# Development
bun run dev                     # Run with ADK devtools
bun run web                     # Open ADK web interface
bun run build                   # Compile TypeScript
bun run start                   # Run compiled JavaScript
```

## � Troubleshooting

### Port Already in Use

If you see `EADDRINUSE` error:

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>

# Or use the auto-start script which handles this
bun run demo-server-auto
```

### Session Not Persisting

**Symptoms:**
- Agent doesn't remember previous conversation turns
- Agent asks for information already provided
- Multi-turn conversations fail

**Solution:**
- Ensure you're using the same `sessionId` for all requests in a conversation
- Verify the server is using `getSession()` before `createSession()`
- Check server logs for "Using existing session" messages

### API Key Issues

```bash
# Verify your API key is set
echo $GOOGLE_GENAI_API_KEY

# If empty, set it
export GOOGLE_GENAI_API_KEY="your-api-key-here"
```

## 🏗️ Architecture

### In-Memory Mode
```
User Input → InMemoryRunner → Agent → Tools → Response
                    ↓
              SessionService (in-memory storage)
```

### Server Mode
```
HTTP Request → Hono Server → InMemoryRunner → Agent → Tools
                                    ↓
                              SessionService (persistent across requests)
                                    ↓
                              Streaming Response
```

## 📚 Learn More

- [Google ADK Documentation](https://github.com/google/genkit/tree/main/js/adk)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Hono Framework](https://hono.dev/)
- [Bun Runtime](https://bun.sh/)