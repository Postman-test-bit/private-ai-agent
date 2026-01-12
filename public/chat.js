const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const chatSessionsContainer = document.getElementById("chat-sessions");
const newChatBtn = document.getElementById("new-chat-btn");
const requestCountEl = document.getElementById("request-count");
const modelSelector = document.getElementById("model-selector");
const fileInput = document.getElementById("file-input");
const fileUploadBtn = document.getElementById("file-upload-btn");
const attachedFilesDiv = document.getElementById("attached-files");
const fileChipsContainer = document.getElementById("file-chips-container");

let chatSessions = [];
let currentSessionId = null;
let isProcessing = false;
let requestsLeft = 50; // Daily Limit
let selectedModel = "sdet-v1"; // Default model
let attachedFiles = [];

// --- Markdown & Highlight Setup ---

// Configure marked options
marked.setOptions({
  breaks: true, // Enable GFM line breaks
  langPrefix: "hljs language-",
});

// Custom renderer for code blocks
const renderer = new marked.Renderer();
renderer.code = function (code, language) {
  const validCode = code ? String(code) : "";
  const validLang = !!(language && hljs.getLanguage(language));

  let highlighted;
  try {
    if (validLang) {
      highlighted = hljs.highlight(validCode, { language }).value;
    } else {
      highlighted = hljs.highlightAuto(validCode).value;
    }
  } catch (e) {
    console.warn("Highlighting failed, falling back to plain text:", e);
    highlighted = escapeHtml(validCode);
  }

  const displayLang = language || "text";

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
      <div style="display:none" class="raw-code">${escapeHtml(validCode)}</div> 
    </div>
  `;
};

marked.use({ renderer });

// Global handler for the Copy Code button
window.copyCode = function (btn) {
  const wrapper = btn.closest(".code-block-wrapper");
  const rawCodeDiv = wrapper.querySelector(".raw-code");

  if (!rawCodeDiv) return;

  const textarea = document.createElement("textarea");
  textarea.innerHTML = rawCodeDiv.innerHTML;
  const val = textarea.value;

  navigator.clipboard
    .writeText(val)
    .then(() => {
      const originalContent = btn.innerHTML;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied`;
      setTimeout(() => {
        btn.innerHTML = originalContent;
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
};

function renderMarkdown(text) {
  if (!text) return "";
  try {
    // Force sync parsing explicitly (though pinning version 12.0.2 is the main fix)
    const rawMarkup = marked.parse(text, { async: false });

    // Safety check: if marked returned a Promise (should not happen with v12), fallback to text
    if (typeof rawMarkup !== "string") {
      console.warn(
        "Marked returned non-string (likely Promise). Fallback to plain text."
      );
      return escapeHtml(text);
    }

    // Sanitize
    return DOMPurify.sanitize(rawMarkup, {
      ADD_TAGS: [
        "div",
        "span",
        "button",
        "svg",
        "rect",
        "path",
        "line",
        "polyline",
        "circle",
        "pre",
        "code",
      ],
      ADD_ATTR: [
        "class",
        "viewBox",
        "fill",
        "stroke",
        "stroke-width",
        "stroke-linecap",
        "stroke-linejoin",
        "d",
        "x",
        "y",
        "width",
        "height",
        "rx",
        "ry",
        "x1",
        "y1",
        "x2",
        "y2",
        "points",
        "onclick",
      ],
    });
  } catch (e) {
    console.error("Markdown rendering failed:", e);
    return escapeHtml(text);
  }
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
    const newId = createNewSession();
    switchToSession(newId);
  } else if (currentSessionId === sessionId) {
    switchToSession(chatSessions[0].id);
  } else {
    renderSessions();
  }
}

// --- Request Counter Logic ---
function updateRequestCount() {
  if (requestCountEl) {
    requestCountEl.textContent = requestsLeft;
  }
  localStorage.setItem("requestsLeft", requestsLeft);
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

    const titleSpan = document.createElement("span");
    titleSpan.className = "session-title";
    titleSpan.textContent = session.title;

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

  // Use Markdown Rendering
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
    renderMessages(session.history);
    return;
  }
  requestsLeft--;
  updateRequestCount();

  session.history[index].content = newContent;

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

// Fallback escaping if markdown fails or for raw code blocks
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
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

modelSelector.addEventListener("change", (e) => {
  selectedModel = e.target.value;
  localStorage.setItem("selectedModel", selectedModel);
});

fileUploadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", handleFileUpload);

// --- Message Sending & Streaming ---

async function sendMessage() {
  console.log("Send button clicked");
  const message = userInput.value.trim();
  console.log(
    "Message:",
    message,
    "Attached files:",
    attachedFiles.length,
    "isProcessing:",
    isProcessing
  );

  // Allow sending if there's a message OR if there are attached files
  if ((message === "" && attachedFiles.length === 0) || isProcessing) {
    console.log("Blocked: Empty message and no files, or already processing");
    return;
  }

  if (requestsLeft <= 0) {
    alert("You have reached your daily request limit.");
    return;
  }

  const session = chatSessions.find((s) => s.id === currentSessionId);
  if (!session) return;

  requestsLeft--;
  updateRequestCount();

  // Prepare message with files if any
  let messageContent = message;
  const filesData = [...attachedFiles]; // Copy files for this message

  if (filesData.length > 0) {
    // Add user message if exists
    if (messageContent) {
      messageContent += "\n\n";
    }

    // Add file contents
    messageContent += "=== ATTACHED FILES ===\n\n";
    filesData.forEach((file) => {
      messageContent += `--- File: ${file.name} ---\n`;
      if (file.content && file.content !== `[Binary file: ${file.name}]`) {
        messageContent += file.content;
      } else {
        messageContent += `[Binary file - content not extracted]`;
      }
      messageContent += `\n\n`;
    });
    messageContent += "=== END OF FILES ===";
  }

  const userMsgObj = {
    role: "user",
    content: messageContent,
    files: filesData, // Store files with message
  };
  session.history.push(userMsgObj);

  userInput.value = "";
  userInput.style.height = "auto";

  // Clear attached files after sending
  clearAttachedFiles();

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

  const assistantMsgObj = { role: "assistant", content: "" };
  const assistantIndex = session.history.push(assistantMsgObj) - 1;

  const assistantEl = createMessageElement(assistantMsgObj, assistantIndex);
  chatMessages.appendChild(assistantEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const contentTarget = assistantEl.querySelector(".message-content");

  try {
    let response;

    if (selectedModel !== "sdet-v1") {
      // Use OpenRouter API for non-Cloudflare models
      // Map model sen to OlectiopenRouter model IDs
      let modelId;
      switch(selectedModel) {
        case "xiaomi-mimo":
          modelId = "xiaomi/mimo-v2-flash:free";
          break;
        case "gpt-oss-120b":
          modelId = "openai/gpt-oss-120b:free";
          break;
        case "llama-3.3-70b":
          modelId = "meta-llama/llama-3.3-70b-instruct:free";
          break;
        case "molmo-2-8b":
          modelId = "allenai/molmo-2-8b:free";
          break;
        case "seedream-4.5":
          modelId = "bytedance-seed/seedream-4.5";
          break;
        case "nemotron-3-nano":
          modelId = "nvidia/nemotron-3-nano-30b-a3b:free";
          break;
        case "devstral-2512":
          modelId = "mistralai/devstral-2512:free";
          break;
        case "riverflow-v2":
          modelId = "sourceful/riverflow-v2-max-preview";
          break;
        default:
          modelId = "xiaomi/mimo-v2-flash:free";
      }

      // Prepare messages (file content already included in msg.content)
      // Filter out initial assistant greeting and gonverset cation history
      let conversationHistory = session.history.slice(0, -1);

      // Remove initial assistant greeting if it's the first message
      if (
        conversationHistory.length > 0 &&
        conversationHistory[0].role === "assistant"
      ) {
        conversationHistory = conversationHistory.slice(1);
      }

      const formattedMessages = conversationHistory.map((msg) => ({
        e: msg.role,
        content: msg.content,
      }));

      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer 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",
        },
        body: JSON.stringify({
          model: modelId,
          messages: formattedMessages,
          stream: true,
        }),
      });
    } else {
      // Use default Cloudflare Workers AI
      // Prepare messages (file content already included in msg.content)
      let conversationHistory = session.history.slice(0, -1);

      // Remove initial assistant greeting if it's the first message
      if (
        conversationHistory.length > 0 &&
        conversationHistory[0].role === "assistant"
      ) {
        conversationHistory = conversationHistory.slice(1);
      }

      const formattedMessages = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedMessages,
        }),
      });
    }

    if (!response.ok) throw new Error("Failed to get response");
    if (!response.body) throw new Error("Response body is null");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponseText = "";
    let buffer = "";

    const flushText = () => {
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

// --- File Upload Logic ---

function getFileIcon(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const iconMap = {
    js: "https://cdn-icons-png.flaticon.com/128/5968/5968292.png",
    ts: "https://cdn-icons-png.flaticon.com/128/5968/5968381.png",
    py: "https://cdn-icons-png.flaticon.com/128/5968/5968350.png",
    pdf: "https://cdn-icons-png.flaticon.com/128/337/337946.png",
    doc: "https://cdn-icons-png.flaticon.com/128/281/281760.png",
    jpg: "https://cdn-icons-png.flaticon.com/128/337/337948.png",
    png: "https://cdn-icons-png.flaticon.com/128/337/337948.png",
  };
  return (
    iconMap[ext] || "https://cdn-icons-png.flaticon.com/128/3767/3767084.png"
  );
}

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractFileContent(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("[Error reading file]");

    const textTypes = [
      ".txt",
      ".js",
      ".ts",
      ".py",
      ".java",
      ".c",
      ".cpp",
      ".html",
      ".css",
      ".json",
      ".xml",
      ".md",
      ".csv",
    ];
    const isTextFile = textTypes.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (isTextFile || file.type.startsWith("text/")) {
      reader.readAsText(file);
    } else {
      resolve(`[Binary file: ${file.name}]`);
    }
  });
}

async function handleFileUpload(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  // Validate file sizes - Applied uniformly to ALL models
  // Model context windows:
  //   Text Models:
  //   - Xiaomi Mimo-v2: 200k tokens
  //   - GPT OSS 120B: 131k tokens
  //   - Llama 3.3 70B: 128k tokens
  //   - Devstral 2 (Code): 262k tokens
  //   - Nemotron 3 Nano (Agent): 256k tokens
  //   Vision/Multimodal:
  //   - Molmo2 8B: 37k tokens (vision+video)
  //   Image Generation:
  //   - Seedream 4.5: 4k tokens (text-to-image)
  //   - Riverflow V2: 8k tokens (text/image-to-image)
  //   - SDET-v1 (Cloudflare): Varies
  //
  // Conservative limits to work with all models:
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB total for all attached files
  const MAX_SINGLE_FILE = 5 * 1024 * 1024; // 5MB maximum per individual file

  // Check individual file sizes
  for (const file of files) {
    if (file.size > MAX_SINGLE_FILE) {
      alert(
        `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(
          2
        )}MB). Maximum file size is 5MB.`
      );
      fileInput.value = "";
      return;
    }
  }

  // Check current total + new files
  const currentTotal = attachedFiles.reduce((sum, f) => sum + f.size, 0);
  const newFilesTotal = files.reduce((sum, f) => sum + f.size, 0);
  const combinedTotal = currentTotal + newFilesTotal;

  if (combinedTotal > MAX_SIZE) {
    alert(
      `Total file size would exceed 10MB limit.\nCurrent: ${(
        currentTotal /
        1024 /
        1024
      ).toFixed(2)}MB\nNew files: ${(newFilesTotal / 1024 / 1024).toFixed(
        2
      )}MB\nTotal: ${(combinedTotal / 1024 / 1024).toFixed(2)}MB`
    );
    fileInput.value = "";
    return;
  }

  // Show loading state
  fileUploadBtn.disabled = true;
  fileUploadBtn.style.opacity = "0.5";
  fileUploadBtn.title = "Uploading...";

  // Show chips container with loading message
  fileChipsContainer.classList.remove("hidden");
  attachedFilesDiv.innerHTML =
    '<div style="padding: 8px; color: var(--text-secondary); font-size: 0.875rem;">📤 Uploading ' +
    files.length +
    " file(s)...</div>";

  let successCount = 0;

  for (const file of files) {
    try {
      const content = await extractFileContent(file);
      const base64 = await convertFileToBase64(file);
      attachedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: base64,
        content: content,
      });
      successCount++;
    } catch (error) {
      console.error("Error reading file:", error);
      alert(`Failed to read file: ${file.name}`);
    }
  }

  // Re-enable button
  fileUploadBtn.disabled = false;
  fileUploadBtn.style.opacity = "1";
  fileUploadBtn.title = "";

  // Show success message briefly before rendering chips
  if (successCount > 0) {
    attachedFilesDiv.innerHTML =
      '<div style="padding: 8px; color: var(--success, #10b981); font-size: 0.875rem;">✓ ' +
      successCount +
      " file(s) uploaded</div>";
    setTimeout(() => {
      renderAttachedFiles();
    }, 800);
  } else {
    fileChipsContainer.classList.add("hidden");
  }

  fileInput.value = "";
}

function renderAttachedFiles() {
  attachedFilesDiv.innerHTML = "";

  if (attachedFiles.length > 0) {
    fileChipsContainer.classList.remove("hidden");

    attachedFiles.forEach((file, index) => {
      const chip = document.createElement("div");
      chip.className = "file-chip";

      const fileIcon = document.createElement("img");
      fileIcon.src = getFileIcon(file.name);
      fileIcon.style.width = "16px";
      fileIcon.style.height = "16px";
      fileIcon.style.objectFit = "contain";
      fileIcon.style.marginRight = "6px";

      const fileName = document.createElement("span");
      fileName.textContent = file.name;

      const removeBtn = document.createElement("button");
      removeBtn.className = "file-chip-remove";
      removeBtn.innerHTML = "×";
      removeBtn.onclick = () => removeFile(index);

      chip.appendChild(fileIcon);
      chip.appendChild(fileName);
      chip.appendChild(removeBtn);
      attachedFilesDiv.appendChild(chip);
    });
  } else {
    fileChipsContainer.classList.add("hidden");
  }
}

function removeFile(index) {
  attachedFiles.splice(index, 1);
  renderAttachedFiles();
}

function clearAttachedFiles() {
  attachedFiles = [];
  renderAttachedFiles();
}

// Init

loadSessions();

// Load saved model selection
const savedModel = localStorage.getItem("selectedModel");
if (savedModel) {
  selectedModel = savedModel;
  modelSelector.value = savedModel;
}


