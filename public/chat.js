const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const chatSessionsContainer = document.getElementById("chat-sessions");
const newChatBtn = document.getElementById("new-chat-btn");
const requestCountEl = document.getElementById("request-count");

let chatSessions = [];
let currentSessionId = null;
let isProcessing = false;
let requestsLeft = 50; // Daily Limit

// --- Markdown & Highlight Setup ---
// Configure marked to use highlight.js
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-', // highlight.js css expects this
  breaks: true, // GFM breaks
});

// Custom renderer for code blocks to add Header with Language & Copy Button
const renderer = new marked.Renderer();
renderer.code = function (code, language) {
  const validLang = !!(language && hljs.getLanguage(language));
  const highlighted = validLang
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;
  
  const displayLang = language || 'code';

  return `
    <div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-lang">${displayLang}</span>
        <button class="code-copy-btn" onclick="copyCode(this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy
        </button>
      </div>
      <pre><code class="hljs ${language}">${highlighted}</code></pre>
      <div style="display:none" class="raw-code">${escapeHtml(code)}</div> 
    </div>
  `;
};
marked.use({ renderer });

// Global handler for the Copy Code button inside generated HTML
window.copyCode = function(btn) {
  // The raw code is stored in a hidden div sibling to the pre
  const wrapper = btn.closest('.code-block-wrapper');
  const rawCodeDiv = wrapper.querySelector('.raw-code');
  
  // We need to unescape HTML entities to get back the raw code
  const textArea = document.createElement('textarea');
  textArea.innerHTML = rawCodeDiv.innerHTML;
  const val = textArea.value;

  navigator.clipboard.writeText(val).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied`;
    setTimeout(() => {
      btn.innerHTML = originalText;
    }, 2000);
  });
};

function renderMarkdown(text) {
  if (!text) return "";
  const rawMarkup = marked.parse(text);
  // Sanitize to prevent XSS
  return DOMPurify.sanitize(rawMarkup, {
    ADD_TAGS: ['div', 'span', 'button', 'svg', 'rect', 'path', 'line', 'polyline', 'circle', 'pre', 'code'],
    ADD_ATTR: ['class', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'x', 'y', 'width', 'height', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'points', 'onclick']
  });
}

// --- Icons ---
const ICONS = {
  user: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  assistant: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  delete: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  regenerate: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>`,
  thumbUp: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`,
  thumbDown: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>`,
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createNewSession() {
  const sessionId = generateId();
  const session = {
    id: sessionId,
    title: "New Chat",
    history: [
      {
        role: "assistant",
        content:
          "Hello. I am your SDET coding agent. Ready for your instructions.",
      },
    ],
  };
  chatSessions.unshift(session);
  saveSessions();
  return sessionId;
}

function switchToSession(sessionId) {
  currentSessionId = sessionId;
  const session = chatSessions.find((s) => s.id === sessionId);
  if (!session) return;

  renderMessages(session.history);
  renderSessions();
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 0);
}

function deleteSession(e, sessionId) {
  e.stopPropagation(); // Prevent triggering the session click
  if (!confirm("Are you sure you want to delete this session?")) return;

  chatSessions = chatSessions.filter((s) => s.id !== sessionId);
  saveSessions();

  if (chatSessions.length === 0) {
    // If no sessions left, create a new one
    const newId = createNewSession();
    switchToSession(newId);
  } else if (currentSessionId === sessionId) {
    // If we deleted the active session, switch to the first available one
    switchToSession(chatSessions[0].id);
  } else {
    // Just re-render list
    renderSessions();
  }
}

// --- Request Counter Logic ---
function updateRequestCount() {
  requestCountEl.textContent = requestsLeft;
  localStorage.setItem("requestsLeft", requestsLeft);
}

function loadRequestCount() {
  const saved = localStorage.getItem("requestsLeft");
  if (saved) {
    requestsLeft = parseInt(saved, 10);
  }
  updateRequestCount();
}

// --- Rendering Logic ---

function renderSessions() {
  chatSessionsContainer.innerHTML = "";
  chatSessions.forEach((session) => {
    const sessionEl = document.createElement("div");
    sessionEl.className = "chat-session-item";
    if (session.id === currentSessionId) {
      sessionEl.classList.add("active");
    }

    // Title Span
    const titleSpan = document.createElement("span");
    titleSpan.className = "session-title";
    titleSpan.textContent = session.title;

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-session-btn";
    deleteBtn.innerHTML = ICONS.delete;
    deleteBtn.title = "Delete Chat";
    deleteBtn.addEventListener("click", (e) => deleteSession(e, session.id));

    sessionEl.appendChild(titleSpan);
    sessionEl.appendChild(deleteBtn);

    sessionEl.addEventListener("click", () => switchToSession(session.id));
    chatSessionsContainer.appendChild(sessionEl);
  });
}

function renderMessages(history) {
  chatMessages.innerHTML = "";
  history.forEach((msg, index) => {
    if (!msg.content && index !== history.length - 1) return;
    const msgEl = createMessageElement(msg, index);
    chatMessages.appendChild(msgEl);
  });
}

function createMessageElement(msg, index) {
  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${msg.role}-message`;
  wrapper.dataset.index = index;

  // 1. Role Header
  const roleHeader = document.createElement("div");
  roleHeader.className = "message-role";
  roleHeader.innerHTML = `${ICONS[msg.role]} ${
    msg.role === "user" ? "You" : "SDET AI"
  }`;

  // 2. Content
  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  // CHANGED: Use Markdown Rendering instead of simple escaping
  contentDiv.innerHTML = renderMarkdown(msg.content);

  // 3. Actions
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "message-actions";

  if (msg.role === "user") {
    const editBtn = createBtn("edit", "Edit", () => enterEditMode(index));
    const deleteBtn = createBtn("delete", "Delete", () => deleteMessage(index));
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
  } else {
    // Logic: If it's the very first message (Index 0) AND it's an assistant, DO NOT show actions.
    const isGreeting = index === 0 && msg.role === "assistant";

    if (!isGreeting) {
      const copyBtn = createBtn("copy", "Copy", () =>
        copyToClipboard(msg.content)
      );
      const regenBtn = createBtn("regenerate", "Regenerate", () =>
        regenerateMessage(index)
      );
      const likeBtn = createBtn("thumbUp", "Good response", () =>
        console.log("Liked", index)
      );
      const dislikeBtn = createBtn("thumbDown", "Bad response", () =>
        console.log("Disliked", index)
      );

      actionsDiv.appendChild(copyBtn);
      actionsDiv.appendChild(regenBtn);
      actionsDiv.appendChild(likeBtn);
      actionsDiv.appendChild(dislikeBtn);
    }
  }

  wrapper.appendChild(roleHeader);
  wrapper.appendChild(contentDiv);
  wrapper.appendChild(actionsDiv);

  return wrapper;
}

function createBtn(iconName, title, onClick) {
  const btn = document.createElement("button");
  btn.className = `action-btn ${iconName}`;
  btn.innerHTML = ICONS[iconName];
  btn.title = title;
  btn.onclick = onClick;
  return btn;
}

// --- Actions Implementation ---

function deleteMessage(index) {
  const session = chatSessions.find((s) => s.id === currentSessionId);
  if (!session) return;

  if (confirm("Delete this message?")) {
    session.history.splice(index, 1);
    saveSessions();
    renderMessages(session.history);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

function regenerateMessage(index) {
  const session = chatSessions.find((s) => s.id === currentSessionId);
  if (!session || isProcessing) return;

  // Decrement request count for regeneration as well
  if (requestsLeft <= 0) {
    alert("Daily limit reached.");
    return;
  }
  requestsLeft--;
  updateRequestCount();

  session.history.splice(index, 1);
  saveSessions();
  renderMessages(session.history);

  streamResponse(session);
}

function enterEditMode(index) {
  const session = chatSessions.find((s) => s.id === currentSessionId);
  if (!session) return;

  const wrapper = chatMessages.querySelector(
    `.message-wrapper[data-index="${index}"]`
  );
  if (!wrapper) return;

  const contentDiv = wrapper.querySelector(".message-content");
  const actionsDiv = wrapper.querySelector(".message-actions");

  actionsDiv.style.display = "none";

  const currentText = session.history[index].content;
  contentDiv.innerHTML = "";

  const textarea = document.createElement("textarea");
  textarea.className = "edit-textarea";
  textarea.value = currentText;
  textarea.rows = 3;

  setTimeout(() => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + 10 + "px";
  }, 0);

  const editControls = document.createElement("div");
  editControls.className = "edit-actions";

  const saveBtn = document.createElement("button");
  saveBtn.className = "save-btn";
  saveBtn.textContent = "Save & Submit";
  saveBtn.onclick = () => saveEdit(index, textarea.value);

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "cancel-btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = () => {
    renderMessages(session.history);
  };

  editControls.appendChild(cancelBtn);
  editControls.appendChild(saveBtn);

  contentDiv.appendChild(textarea);
  contentDiv.appendChild(editControls);
  textarea.focus();
}

function saveEdit(index, newContent) {
  const session = chatSessions.find((s) => s.id === currentSessionId);
  if (!session) return;

  if (requestsLeft <= 0) {
    alert("Daily limit reached.");
    renderMessages(session.history); // restore view
    return;
  }
  requestsLeft--;
  updateRequestCount();

  session.history[index].content = newContent;

  // Remove all history after this index to regenerate fresh
  const elementsToRemove = session.history.length - 1 - index;
  if (elementsToRemove > 0) {
    session.history.splice(index + 1, elementsToRemove);
  }

  saveSessions();
  renderMessages(session.history);

  streamResponse(session);
}

// --- Core App Logic ---

function saveSessions() {
  try {
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
    localStorage.setItem("currentSessionId", currentSessionId);
  } catch (e) {
    console.error("Failed to save sessions:", e);
  }
}

function loadSessions() {
  try {
    const saved = localStorage.getItem("chatSessions");
    const savedCurrentId = localStorage.getItem("currentSessionId");
    if (saved) {
      chatSessions = JSON.parse(saved);
      currentSessionId = savedCurrentId;
      if (
        !currentSessionId ||
        !chatSessions.find((s) => s.id === currentSessionId)
      ) {
        currentSessionId = chatSessions[0]?.id || createNewSession();
      }
    } else {
      currentSessionId = createNewSession();
    }
    switchToSession(currentSessionId);
  } catch (e) {
    console.error("Failed to load sessions:", e);
    currentSessionId = createNewSession();
    switchToSession(currentSessionId);
  }
}

function updateSessionTitle(sessionId, userMessage) {
  const session = chatSessions.find((s) => s.id === sessionId);
  if (session && session.history.length <= 2) {
    session.title =
      userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : "");
    saveSessions();
    renderSessions();
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 200) + "px";
});

userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);

newChatBtn.addEventListener("click", () => {
  const newSessionId = createNewSession();
  switchToSession(newSessionId);
});

// --- Message Sending & Streaming ---

async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "" || isProcessing) return;

  if (requestsLeft <= 0) {
    alert("You have reached your daily request limit.");
    return;
  }

  const session = chatSessions.find((s) => s.id === currentSessionId);
  if (!session) return;

  // Decrement Counter
  requestsLeft--;
  updateRequestCount();

  // 1. Add User Message
  const userMsgObj = { role: "user", content: message };
  session.history.push(userMsgObj);

  userInput.value = "";
  userInput.style.height = "auto";

  chatMessages.appendChild(
    createMessageElement(userMsgObj, session.history.length - 1)
  );
  chatMessages.scrollTop = chatMessages.scrollHeight;

  updateSessionTitle(currentSessionId, message);

  streamResponse(session);
}

async function streamResponse(session) {
  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;
  typingIndicator.classList.add("visible");

  // Placeholder for Assistant
  const assistantMsgObj = { role: "assistant", content: "" };
  const assistantIndex = session.history.push(assistantMsgObj) - 1;

  const assistantEl = createMessageElement(assistantMsgObj, assistantIndex);
  chatMessages.appendChild(assistantEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const contentTarget = assistantEl.querySelector(".message-content");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: session.history.slice(0, -1),
      }),
    });

    if (!response.ok) throw new Error("Failed to get response");
    if (!response.body) throw new Error("Response body is null");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponseText = "";
    let buffer = "";

    const flushText = () => {
      // CHANGED: Render Markdown during streaming
      contentTarget.innerHTML = renderMarkdown(fullResponseText);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        processBuffer(buffer + "\n\n");
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const result = processBuffer(buffer);
      buffer = result.buffer;
    }

    function processBuffer(inputBuffer) {
      const parsed = consumeSseEvents(inputBuffer);
      for (const data of parsed.events) {
        if (data === "[DONE]") return { buffer: "" };
        try {
          const jsonData = JSON.parse(data);
          let content = "";
          if (jsonData.response) content = jsonData.response;
          else if (jsonData.choices?.[0]?.delta?.content)
            content = jsonData.choices[0].delta.content;

          if (content) {
            fullResponseText += content;
            flushText();
          }
        } catch (e) {
          /* ignore */
        }
      }
      return { buffer: parsed.buffer };
    }

    session.history[assistantIndex].content = fullResponseText;
    saveSessions();
    renderMessages(session.history);
  } catch (error) {
    console.error("Error:", error);
    session.history[assistantIndex].content = "Error processing request.";
    renderMessages(session.history);
  } finally {
    typingIndicator.classList.remove("visible");
    isProcessing = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

function consumeSseEvents(buffer) {
  let normalized = buffer.replace(/\r/g, "");
  const events = [];
  let eventEndIndex;
  while ((eventEndIndex = normalized.indexOf("\n\n")) !== -1) {
    const rawEvent = normalized.slice(0, eventEndIndex);
    normalized = normalized.slice(eventEndIndex + 2);
    const lines = rawEvent.split("\n");
    const dataLines = [];
    for (const line of lines) {
      if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trimStart());
      }
    }
    if (dataLines.length > 0) events.push(dataLines.join("\n"));
  }
  return { events, buffer: normalized };
}

// Init
loadRequestCount();
loadSessions();