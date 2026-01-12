# Private AI Agent

A powerful multi-model AI chat application with file upload capabilities, supporting 9+ AI models from Cloudflare and OpenRouter. Built for developers who need flexible AI interactions with code analysis, vision processing, and image generation.

![AI Models](https://img.shields.io/badge/AI-9%2B%20Models-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![TypeScript](https://img.shields.io/badge/TypeScript-Workers-orange)

## ✨ Features

### 🤖 Multiple AI Modlable)
ls (9 Avain**Text Generation Models:**
- SDET-v1 (Cloudflare Workers AI)
- Xiaomi Mimo-v2 (200k context)
- GPT OSS 120B (131k context)
- Llama 3.3 70B (128k context)

**Specialized Models:**
- **Devstral 2** - Coding specialist with 262k context window
- **Nemotron 3 Nano** - Agentic AI with 256k context
- **Molmo2 8B** - Vision & video understanding

**Image Generation:**
- **Seedream 4.5** - Text-to-image generation
- **Riverflow V2** - Text/image-to-image generation

### 📁 Smart File Upload System
- ✅ Multi-file upload support
- ✅ Max 5MB per file, 10MB total
- ✅ Automatic text extraction (.js, .ts, .py, .java, .html, .css, .json, .md, etc.)
- ✅ Ftype iile cons (JavaScript, Python, PDF, images, etc.)
- ✅ Real-time upload progress
- ✅ File content included in AI context
- ✅ Binary file detection

### 💬 Advanced Chat Interface
- 🗨️ Multiple chat sessions
- 💾 Persistent chat history (localStorage)
- ⚡ Real-time streaming responn- 🎨 Code synses (SSE)	ax highlighting (Marked.js)
- 🌓 Modern dark theme
- 📱 Mobile-responsive design
- 🔄 Session management (create, switch, delete)

### 🔧 Developer Features
- 🚀 Zero-framework vanilla JavaScript frontend
- 📘 TypeScript backend with Cloudflare Workers
- 🔌 OpenRouter API integration
- 🎯 Easy model switching
- 📊 File size validation
- 🔍 Debug logging
- 🎨 Clean, maintainable code

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare Workers)
- Cloudflare account with Workers AI access
- [OpenRouter API Key](https://openrouter.ai/) (for non-Cloudflare models)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd private-ai-agent
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure API Keys:**

   Update the OpenRouter API key in `public/chat.js`:
   ```javascript
   Authorization: "Bearer YOUR_OPENROUTER_API_KEY"
   ```

4. **Generate TypeScript definitions:**

   ```bash
   npm run cf-typegen
   ```

### Development

**Start the development server:**

```bash
npm run dev
```

The application will be available at: `http://localhost:8787`

**Note:** Workers AI uses your Cloudflare account even in local development, which may incur charges.

### Deployment

**Deploy to Cloudflare Workers:**

```bash
npm run deploy
```

Your application will be deployed to: `https://your-worker-name.workers.dev`

### Monitoring

**View real-time logs:**

```bash
npm run tail
# or
npx wrangler tail
```

**Check deployment status:**

```bash
npx wrangler deployments list
```

## 📂 Project Structure

```
private-ai-agent/
├── public/                 # Frontend assets
│   ├── index.html        # Main chat UI
│   └── chat.js           # Chat logic & API calls
│                       # - Session management
│                       # - File upload handling
│                       # - Streaming responses
│                       # - Model switching
├── src/
│   ├── index.ts          # Cloudflare Worker entry
│   └── types.ts          # TypeScript definitions
├── test/                   # Test files
├── wrangler.jsonc          # Worker configuration
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
└── README.md               # Documentation
```

## 🏗️ Architecture

### Backend (Cloudflare Worker)

**File: `src**/index.ts`

- ✅ Handles `/api/chat` POST requests
- ✅ Streams AI responses using Server-Sent Events (SSE)
- ✅ Integrates with CloudflareI
- ✅ CO Workers ARS-enabled for local development
- ✅ TypeScript for type safety

**Flow:**
```
Client Request → Worker → Workers AI → Stream Response → Client
```

### Frontend (VanilavaScript)
la J
**Files:** `public/index.html`, `public/chat.js`

#### Key Components:

**1. Session Management**
- Multiple chat sessions stored in localStorage
- Create, switch, and delete sessions
- Persistent chat history across page reloads

**2. File Upload System**
```javascript
File Selection → Size Validation → Text Extraction → Attach to Message
```
- Validates file sizes (5MB/file, 10MB total)
- Extracts text from code files
- Displays file icons by type
- Shows upload progress

**3. AI Model Routing**
- **Cloudflare Models:** `SDET-v1` → `/api/chat` endpoint
- **OpenRouter Models:** All others → `https://openrouter.ai/api/v1/chat/completions`
- Dynamic model ID mapping
- Seodel switamless mching

**4. Streaming Response Handler**
- Processes SSE streams
- Real-time markdown rendering
- Code syntax highlighting (Marked.js)
- Typing indicators

## ⚙️ Configuration

### Adding New AI Models

**1. Add model option to HTML:**

```html
<!-- File: publicml -->
<select/index.ht id="model-selector">
  <option value="your-model-id">Model Name [Badge]</option>
</select>
```

**2. Add model ID mapping:**

```javascript
// File: public/chat.js
switch(selectedModel) {
  case "your-model-id":
    modelId = "provider/model-name:variant";
    break;
}
```

### Changing File Size Limits

```javascript
// File: public/chat.js, line ~835
const MAX_SIZE =24 * 1024; // 10 10 * 10MB total
const MAX_SINGLE_FILE = 5 * 1024 * 1024; // 5MB per file
```

### Customizing System Prompt (Cloudflare Models)

```typescript
// File: src/index.ts
const SYSTEM_PROMPT = "Your custom system prompt here";
```

### Modifying Color Theme

```html
<!-- File: public/index.html -->
<style>
  :root {
    --bg-app: #0a0a0a;
    --bg-surface: #18181b;
    --text-primary: #fafafa;
    /* ... modify colors here ... */
  }
</style>
```

### Supported File Types for Text Extraction

```javascript
// File: public/chat.js
const textTypes = [
  '.txt', '.js', '.ts', '.py', '.java',
  '.c', '.cpp', '.html', '.css', '.json',
  '.xml', '.md', '.csv', '.log', '.yml'
];
```

Add more extensions as needed for  case.

## 📚 API Usage Examples

### Sending a Message with Files

```javascript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'xiaomi/mimo-v2-flash:free',
    messages: [
      {
        role: 'user',
        content: nalyze `Athis code\n\n=== ATTACHED FILES ===\n--- File: script.js ---\n${fileConten OF FILES t}\n=== END===`
      }
    ],
    stream: true
  })
});
```

### Processing Streaming Response

```javascript
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const json = JSON.parse(line.slice(6));
      const content = json.choices[0]?.delta?.content;
      if (content) console.log(content);
    }
  }
}
```

## ⚠️ Troubleshooting

### File Upload Not Working

**Issue:** Send button doesn't respond after attaching files

**Solutions:**
- Check console for errors (F12)
- Verify file size < 5MB per file, < 10MB totn- Ensal filurare suppoe types rted
- Check network tab for failed requests

### 400 Bad Request Error

**Issue:** API returns 400 error

**Causes:**
- Invalid API key
- Model ID typo
- Conversation starting with assistant message
- Unsupported parameters for specific model

**Fix:**
```javascript
// Remove initial assistant greeting before sending to API
let conversationHistory = session.history.slice(0, -1);
if (conversationHistory[0]?.role === 'assistant') {
  conversationHistory = conversationHistory.slice(1);
}
```

### Streaming Response Not Appearing

**Issue:** Response is generated but not displayed

**Checks:**
- Verify SSE event listener is attached
- Check if `isProcessing` flag is stuck
- Inspect network tab for connection issues
- Ensure Maloaded frked.js is or markdown rendering

### Model Not Available

**Issue:** Selected model returns error

**Solutions:**
- Check model is not rate-limited
- Verify model ID is correct
- Try switching to another model
- Check OpenRouter status page

## 📝 License & Credits

### Dependencies

- **Marked.js** - Markdown parser and compiler
- **Cloudflare Workers*erless platfo* - Servrm
- **OpenRouter** - Multi-model AI API gateway

### ModeProvidedls  By

- **Cloudflare** - SDET-v1
- **Xiaomi** - Mimo-v2
- **OpenAI** - GPT OSS 120B
- **Meta** - Llama 3.3 70B
- **Allen Institute fo - Molmo2 8Br AI**
- **ByteDance** - Seedream 4.5
- **NVIDIA** - Nemotron 3 Nano
- **Mistral AI** - Devstral 2
- **Sourceful** - Riverflow V2

## 🔗 Resources

### Documentation
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)

### AI Model References
- [Xiaomi Mimo-v2](https://openrouter.ai/xiaomi/mimo-v2-flash:free)
- [GPT OSS 120B](https://openrouter.ai/openai/gpt-oss-120b:free)
- [Llama 3.3 70B](https://openrter.aiou/meta-llama/llama-3.3-70b-instruct:free)
- [Molmo2 8B](https://openrouter.ai/allenai/molmo-2-8b:free)
- [Devstral 2](https://openrouter.ai/mistralai/devstral-2512:free)
- [Nemotron 3](https://openrouter.ai/nvidia/nemotron-3-nano-30b-a3b:free)

### Tools
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [OpenRouter Dashboard](https://openrouter.ai/keys)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)

---

**Built with ❤️ by developers, for developers.**

Need help? Open an issue or check the documentation!
