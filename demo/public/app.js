const userIdEl = document.getElementById('userId');
const sessionIdEl = document.getElementById('sessionId');
const messageEl = document.getElementById('message');
const outputEl = document.getElementById('output');
const sendBtn = document.getElementById('send');
const cancelBtn = document.getElementById('cancel');
const clearBtn = document.getElementById('clear');
const statusEl = document.getElementById('status');

let controller = null;

function setStatus(s) {
  statusEl.textContent = s;
}

function appendOutput(text) {
  outputEl.textContent += text;
  outputEl.scrollTop = outputEl.scrollHeight;
}

async function sendMessage() {
  const message = messageEl.value.trim();
  if (!message) return;
  const userId = userIdEl.value || 'demo-user';
  const sessionId = sessionIdEl.value || 'demo-session-001';

  sendBtn.disabled = true;
  cancelBtn.disabled = false;
  setStatus('Streaming...');
  appendOutput('\n--- New message ---\n');

  controller = new AbortController();
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId, sessionId }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      appendOutput('\n[Error] ' + err + '\n');
      setStatus('Error');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      appendOutput(chunk);
    }

    setStatus('Completed');
  } catch (err) {
    if (err.name === 'AbortError') {
      appendOutput('\n[Stream aborted]\n');
      setStatus('Aborted');
    } else {
      appendOutput('\n[Error] ' + err.message + '\n');
      setStatus('Error');
    }
  } finally {
    sendBtn.disabled = false;
    cancelBtn.disabled = true;
    controller = null;
  }
}

sendBtn.addEventListener('click', sendMessage);
clearBtn.addEventListener('click', () => (outputEl.textContent = ''));
cancelBtn.addEventListener('click', () => {
  if (controller) controller.abort();
});

// Allow Ctrl+Enter to send
messageEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') sendMessage();
});

// ADK Devtools controls
const adkUrlEl = document.getElementById('adkUrl');
const openAdkBtn = document.getElementById('openAdk');
const checkAdkBtn = document.getElementById('checkAdk');
const adkStatusEl = document.getElementById('adkStatus');

openAdkBtn.addEventListener('click', () => {
  const url = adkUrlEl.value || 'http://localhost:3001';
  window.open(url, '_blank');
});

checkAdkBtn.addEventListener('click', async () => {
  const url = (adkUrlEl.value || 'http://localhost:3001').replace(/\/$/, '') + '/';
  adkStatusEl.textContent = 'Checking...';
  try {
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      adkStatusEl.textContent = 'Reachable';
    } else {
      adkStatusEl.textContent = `Status ${resp.status}`;
    }
  } catch (err) {
    adkStatusEl.textContent = 'Not reachable';
  }
});

// Focus message input by default
messageEl.focus();