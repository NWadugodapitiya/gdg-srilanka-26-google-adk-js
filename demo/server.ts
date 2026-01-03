import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { InMemoryRunner, StreamingMode, Event } from '@google/adk';
import { personalFinanceAgent } from './agent';
import { createUserContent, Part } from '@google/genai';

// Check for required environment variables
console.log('🔍 Checking environment variables...');
const requiredEnvVars = ['GOOGLE_GENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

console.log('Current environment variables:', {
  GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY ? '✅ Set' : '❌ Missing',
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT ? '✅ Set' : '❌ Missing',
  GOOGLE_CLOUD_LOCATION: process.env.GOOGLE_CLOUD_LOCATION ? '✅ Set' : '❌ Missing',
});

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please set the following environment variables:');
  missingEnvVars.forEach(key => console.error(`  export ${key}="your-value-here"`));
  console.error('See env.example for details');
  process.exit(1);
}
console.log('✅ All required environment variables are set');

// Create global runner instance (like the working simulation)
const appName = 'finance_agent_app';

// Mock mode: when using a placeholder key (DUMMY) or explicit USE_MOCK=1,
// we provide canned responses so the UI can be tested without a valid API key.
const mockMode = process.env.GOOGLE_GENAI_API_KEY === 'DUMMY' || process.env.USE_MOCK === '1';

const globalRunner = mockMode
  ? null
  : new InMemoryRunner({
      agent: personalFinanceAgent,
      appName,
    });

const app = new Hono();

import fs from 'fs';

app.get('/', (c) => {
  // Serve the simple browser UI if it exists in ./public/index.html
  try {
    const html = fs.readFileSync(new URL('./public/index.html', import.meta.url), 'utf-8');
    return c.html(html);
  } catch (err) {
    console.error('UI not found:', err);
    return c.text('Finance Agent Hono Server is running! (UI not found)');
  }
});

// Serve static files from ./public (e.g., /public/app.js)
app.get('/public/*', (c) => {
  try {
    const url = new URL(c.req.url);
    const pathname = url.pathname.replace(/^\/public\//, '');
    const fileUrl = new URL(`./public/${pathname}`, import.meta.url);
    const data = fs.readFileSync(fileUrl);
    const ext = pathname.split('.').pop() || '';
    const contentType = ext === 'js' ? 'application/javascript' : ext === 'css' ? 'text/css' : 'text/html';
    return c.body(data, 200, { 'Content-Type': contentType });
  } catch (err) {
    console.error('Static file not found:', err);
    return c.text('Not found', 404);
  }
});

app.post('/chat', async (c) => {
  const { message, userId = 'default-user', sessionId = 'default-session' } = await c.req.json();

  if (!message) {
    return c.json({ error: 'Message is required' }, 400);
  }

  // Get or create session - don't recreate existing sessions!
  console.log(`Checking session: ${sessionId} for user: ${userId}`);

  // If we're in mock mode, avoid calling globalRunner.sessionService (it's null)
  let session: { id: string; state?: any; userId?: string };
  if (mockMode) {
    session = { id: sessionId, userId, state: {} };
    console.log(`✅ Using mock session: ${session.id}`);
  } else {
    try {
      // Try to get existing session first
      session = await globalRunner.sessionService.getSession({
        appName,
        userId,
        sessionId,
      });
      console.log(`✅ Using existing session: ${session!.id}`);
    } catch (error) {
      // Session doesn't exist, create a new one
      console.log(`📝 Creating new session: ${sessionId}`);
      try {
        session = await globalRunner.sessionService.createSession({
          appName,
          userId,
          sessionId,
          state: {},
        });
        console.log(`✅ New session created: ${session.id}`);
      } catch (createError) {
        console.error('❌ Failed to create session:', createError);
        return c.json({ error: 'Failed to create or retrieve session' }, 500);
      }
    }
  }

  return streamText(c, async (stream) => {
    // Set up abort handling
    stream.onAbort(() => {
      console.log('Stream aborted');
    });

    try {
      console.log(`Processing message for user ${userId}, session ${sessionId}`);

      // Mock-mode responses (fast, deterministic) so UI works without a real key
      if (mockMode) {
        await stream.write("Hello! This is a mock agent response.\n");
        await new Promise(r => setTimeout(r, 250));
        await stream.write("I can simulate analysis, budgeting, and reports for testing.\n");
        await new Promise(r => setTimeout(r, 250));
        await stream.write("Try: 'Analyze transactions: ...' or 'Set a budget of $100 for dining.'\n");
        return;
      }

      const userContent = createUserContent(message);
      console.log('Created user content, starting runner...');

      let eventCount = 0;
      for await (const event of globalRunner.runAsync({
        userId,
        sessionId,
        newMessage: userContent,
        runConfig: {
          streamingMode: StreamingMode.SSE,
        },
      })) {
        eventCount++;
        const adkEvent = event as Event;
        console.log(`Event ${eventCount}:`, {
          hasContent: !!adkEvent.content,
          hasParts: !!adkEvent.content?.parts,
          author: adkEvent.author,
          final: !!(adkEvent as any).final,
          errorCode: (adkEvent as any).errorCode
        });

        // Surface ADK error events to the browser so the UI shows meaningful messages
        if ((adkEvent as any).errorCode) {
          const errMsg = (adkEvent as any).errorMessage || 'Unknown ADK error';
          await stream.write(`\n[ADK ERROR ${ (adkEvent as any).errorCode }] ${errMsg}\n`);
          break;
        }

        if (adkEvent.content?.parts?.[0]?.text) {
          const text = adkEvent.content.parts[0].text;
          console.log(`Writing text chunk: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
          await stream.write(text);
        } else if ((adkEvent as any).final) {
          console.log('Final event received, ending stream');
          break;
        }
      }

      console.log(`Processed ${eventCount} events total`);
    } catch (error) {
      const err = error as Error;
      console.error('Streaming error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      await stream.write(`\n[Error: ${err.message}]`);
    }
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
