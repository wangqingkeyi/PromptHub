# PromptHub Chrome Extension

<div align="center">
  <h1>🚀 PromptHub Chrome Extension</h1>
  <p><strong>AI Prompt Manager - Right in Your Browser</strong></p>
</div>

## ✨ Features

- **📝 Prompt Management** - Create, edit, delete prompts with folder and tag organization
- **⭐ Favorites** - Quick access to your most used prompts
- **🔄 Version Control** - Automatic version history with restore capability
- **🔧 Variables** - Template variables `{{variable}}` with dynamic replacement
- **📋 One-Click Copy** - Copy prompts to clipboard instantly
- **🤖 AI Testing** - Test prompts with various AI models directly
- **🎨 Themes** - Dark/Light/System theme with multiple color options
- **🌐 Multi-language** - Chinese and English interface
- **💾 Local Storage** - All data stored locally using IndexedDB

## 📦 Installation

### From Source (Development)

1. Clone the repository:
```bash
git clone https://github.com/legeling/PromptHub.git
cd PromptHub/chrome-extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

### Development Mode

```bash
npm run dev
```

Open the extension popup to see live changes.

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Styling | TailwindCSS |
| State Management | Zustand |
| Local Storage | IndexedDB |
| Build Tool | Vite |
| Icons | Lucide React |

## 📁 Project Structure

```
chrome-extension/
├── public/
│   ├── manifest.json     # Chrome extension manifest
│   └── icons/            # Extension icons
├── src/
│   ├── components/       # React components
│   │   ├── layout/       # Layout components
│   │   ├── prompt/       # Prompt-related components
│   │   ├── folder/       # Folder components
│   │   ├── settings/     # Settings page
│   │   └── ui/           # Shared UI components
│   ├── stores/           # Zustand state stores
│   ├── services/         # Database and AI services
│   ├── i18n/             # Internationalization
│   │   └── locales/      # Translation files
│   ├── styles/           # Global styles
│   ├── types.ts          # TypeScript types
│   ├── App.tsx           # Main App component
│   └── main.tsx          # Entry point
├── index.html            # HTML template
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 Configuration

### AI Model Configuration

1. Click the settings icon in the sidebar
2. Navigate to the "AI Model" section
3. Click "Add Model" and configure:
   - **Provider**: Select from OpenAI, Anthropic, DeepSeek, etc.
   - **API Key**: Your API key
   - **API URL**: API endpoint (auto-filled for most providers)
   - **Model**: Model name (e.g., gpt-4o, claude-3-sonnet)

### Supported AI Providers

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3)
- DeepSeek
- Moonshot (Kimi)
- ZhiPu AI (GLM-4)
- Custom OpenAI-compatible APIs

## 📝 Usage

### Creating a Prompt

1. Click the "New" button in the top bar
2. Fill in the title, description, and prompt content
3. Use `{{variableName}}` syntax for variables
4. Add tags for organization
5. Click "Create" to save

### Using Variables

When copying or testing a prompt with variables, a dialog will appear to fill in the values:

```
Please translate the following {{source_lang}} text to {{target_lang}}:

{{text}}
```

### Testing with AI

1. Configure an AI model in settings
2. Select a prompt and click "AI Test"
3. Fill in any variables if prompted
4. View the AI response

## 🌐 Internationalization

The extension supports both Chinese (zh) and English (en). Change the language in Settings → Language.

## 📄 License

This project is licensed under the [MIT License](../LICENSE).

## 🙏 Acknowledgments

This Chrome extension is based on the [PromptHub](https://github.com/legeling/PromptHub) desktop application.
