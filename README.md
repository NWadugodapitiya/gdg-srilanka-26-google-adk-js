# 🤖 Multi-Turn Personal Finance Agent

A production-ready **multi-turn conversational AI agent** built with **Google ADK** (Agent Development Kit) and TypeScript. This project demonstrates stateful AI agents that maintain conversation context across multiple turns using the Gemini 2.5 Flash model.

Built for **GDG Sri Lanka DevFest 2026** as a comprehensive example of building intelligent, context-aware AI agents.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Google ADK](https://img.shields.io/badge/Google%20ADK-0.2.0-green.svg)](https://github.com/google/genkit/tree/main/js/adk)
[![Bun](https://img.shields.io/badge/Bun-1.3+-orange.svg)](https://bun.sh/)

## ✨ Features

- 🔄 **Multi-turn conversations** with persistent session management
- 🛠️ **Function calling** with 4 specialized finance tools
- 📊 **Transaction analysis** and spending categorization
- 💰 **Budget tracking** with goal setting and status monitoring
- 📈 **Spending reports** with AI-powered recommendations
- 🌊 **Real-time streaming** responses via Server-Sent Events
- 🚀 **Production-ready** HTTP server with Hono
- 🎯 **Type-safe** implementation with Zod validation

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime installed
- Google AI API key ([Get one here](https://ai.google.dev/))

### Installation

```bash
# Clone the repository
git clone https://github.com/octalpixel/gdg-srilanka-26-google-adk-js.git
cd gdg-srilanka-26-google-adk-js

# Navigate to demo folder
cd demo

# Install dependencies
bun install

# Set up environment variables
cp env.example .env
# Edit .env and add your GOOGLE_GENAI_API_KEY
```

### Run the Demo

### Developer UI: ADK Devtools

You can launch the interactive ADK Devtools to inspect the agent, tool calls and session state.

From the `demo/` directory run:

```bash
bun run dev
```

This starts the ADK Devtools web UI (check terminal output for the URL). Open the URL in your browser to debug or visualize agent runs while the server is running.

```bash
# Option 1: In-memory simulation (recommended for testing)
bun run demo

# Option 2: Server-based chat (production-ready)
bun run demo-server-auto
```

## 📁 Project Structure

```
finance-agent-multiturn/
├── demo/                              # Main application code
│   ├── agent.ts                       # Agent + tool definitions
│   ├── server.ts                      # Hono HTTP server
│   ├── simulate-conversation.ts       # In-memory simulation
│   ├── simulate-server-conversation.ts # Server-based simulation
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                           # Environment (gitignored)
│   ├── env.example                    # Environment template
│   └── README.md                      # Detailed demo documentation
├── adk-foundation/                    # ADK documentation (Slidev)
├── reading/                           # Educational guides
│   ├── GOLD_STANDARD_ADK_GUIDE.md
│   └── MULTITURN_GUIDE.md
└── README.md                          # This file
```

## 🎯 How It Works

### Multi-Turn Conversation Flow

The agent demonstrates a complete 5-turn conversation:

1. **Turn 1**: Analyzes spending transactions using `analyze_transactions` tool
2. **Turn 2**: Recalls previous analysis to answer follow-up questions
3. **Turn 3**: Sets budget goals using `set_budget_goal` tool
4. **Turn 4**: Calculates budget status using `calculate_budget_status` tool
5. **Turn 5**: Generates comprehensive report using all stored session data

### Architecture

```
┌─────────────────┐
│  User Input     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  InMemoryRunner             │
│  (Session Management)       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Personal Finance Agent     │
│  - analyze_transactions     │
│  - set_budget_goal          │
│  - calculate_budget_status  │
│  - generate_spending_report │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Gemini 2.5 Flash Model     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  Streaming      │
│  Response       │
└─────────────────┘
```

## 🔧 Available Commands

All commands should be run from the `demo/` directory:

```bash
# Development
bun run demo                    # In-memory conversation simulation
bun run serve                   # Start Hono server (port 3000)
bun run demo-server             # Server-based simulation
bun run demo-server-auto        # Auto-start server + simulation

# ADK Devtools
bun run dev                     # Run agent with development UI
bun run web                     # Open ADK web interface

# Build
bun run build                   # Compile TypeScript to JavaScript
bun run start                   # Run compiled JavaScript
```

## 🛠️ Function Tools

The agent includes 4 specialized tools:

### 1. `analyze_transactions`
Processes and categorizes spending data, calculating totals and identifying top spending categories.

### 2. `set_budget_goal`
Stores budget goals in session state for specific spending categories.

### 3. `calculate_budget_status`
Checks current spending against budget limits and provides status (on track, warning, over budget).

### 4. `generate_spending_report`
Creates formatted reports with spending summaries, budget status, and AI-powered recommendations.

## 🔐 Environment Variables

Create a `.env` file in the `demo/` directory:

```bash
# Required
GOOGLE_GENAI_API_KEY=your_api_key_here

# Optional
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=0
```

Get your API key from: https://ai.google.dev/

## 🌐 HTTP Server API

### Endpoint: `POST /chat`

**Request:**
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

### Example Usage

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze my spending",
    "userId": "demo-user",
    "sessionId": "demo-session"
  }'
```

## 🎓 Key Concepts

### Session Management Pattern

**Critical**: Always check if a session exists before creating a new one to preserve conversation history:

```typescript
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
  // Create new session if doesn't exist
  session = await globalRunner.sessionService.createSession({
    appName,
    userId,
    sessionId,
    state: {},
  });
  console.log(`📝 New session created: ${session.id}`);
}
```

### Session State Structure

```typescript
interface SessionState {
  transactionAnalysis: TransactionAnalysis | null;  // Spending analysis results
  budgetGoals: BudgetGoal[];                        // User-set budget limits
  conversationSummary: string[];                    // Conversation history
}
```

### Streaming Responses

The agent uses `StreamingMode.SSE` for real-time responses:

```typescript
for await (const event of runner.runAsync({
  userId,
  sessionId,
  newMessage: userContent,
  runConfig: { streamingMode: StreamingMode.SSE }
})) {
  if (event.content?.parts?.[0]?.text) {
    console.log(event.content.parts[0].text);
  }
}
```

## 📚 Documentation

- **[Demo README](./demo/README.md)** - Detailed demo documentation with troubleshooting
- **[Multi-Turn Guide](./reading/MULTITURN_GUIDE.md)** - Comprehensive guide to multi-turn conversations
- **[ADK Guide](./reading/GOLD_STANDARD_ADK_GUIDE.md)** - Google ADK best practices

## 🧪 Testing

The project includes multiple simulation scripts:

- **In-memory simulation**: Tests agent without HTTP layer
- **Server simulation**: Tests full HTTP server with streaming
- **Auto-start simulation**: Automatically starts server and runs tests

Run all tests:
```bash
cd demo
bun run demo-server-auto
```

## 🏗️ Tech Stack

- **[@google/adk](https://github.com/google/genkit/tree/main/js/adk)** - Agent Development Kit
- **[@google/genai](https://www.npmjs.com/package/@google/genai)** - Google AI SDK
- **[Hono](https://hono.dev/)** - Fast web framework
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development

## 🤝 Contributing

This project was created for educational purposes. Feel free to:

- Fork and experiment
- Submit issues for bugs or questions
- Share improvements via pull requests

## 📄 License

MIT

## 🎤 Presented At

**GDG Sri Lanka DevFest 2026**  
*Foundations of AI Agents with Google ADK*

---

**Built with ❤️ by the Mithushan using Antigravity and Gemini Models**

For questions or feedback, please open an issue on GitHub.
