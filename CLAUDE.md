# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChatGPT MD is an Obsidian plugin that integrates multiple AI services (OpenAI, Anthropic, Gemini, Ollama, OpenRouter, LmStudio) into Obsidian notes. Current version: 2.8.0 with GPT-5 model support.

## Essential Commands

### Development
```bash
yarn dev              # Development build with watch mode (most common during development)
yarn build            # Production build with TypeScript checks
yarn lint             # Run ESLint on src files
yarn lint:fix         # Fix ESLint issues automatically
```

### Bundle Analysis
```bash
yarn build:analyze         # Build with bundle analysis
yarn build:size            # Build and show main.js file size
yarn analyze               # Analyze bundle composition
yarn build:full-analysis   # Full build and analysis
```

### Version Management (for maintainers)
```bash
npm run update-version 2.0.3        # Update version and create git tag
npm run update-version 2.0.3-beta.1 beta  # Beta version
```

## Architecture

### Core Structure

The plugin uses a **service-oriented architecture** with dependency injection:

1. **Entry Point** (`src/main.ts`):
   - Initializes `ServiceLocator` (dependency container)
   - Loads settings and runs migrations
   - Registers commands via `CommandRegistry`
   - Initializes available models in background

2. **ServiceLocator** (`src/core/ServiceLocator.ts`):
   - Central dependency injection container
   - Factory pattern for AI services: `getAiApiService(serviceType)` instantiates services on-demand
   - **Critical**: Throws error for unknown service types (no fallback)
   - Manages all service instances with proper dependency injection

3. **CommandRegistry** (`src/core/CommandRegistry.ts`):
   - Registers all Obsidian commands
   - Manages model initialization and fetching
   - Handles status bar updates
   - Implements command logic using services from ServiceLocator

### AI Service Architecture

All AI services implement `IAiApiService` interface and extend `BaseAiService`:

**Key Methods:**
- `callAIAPI()`: Main API call method (streaming or non-streaming)
- `inferTitle()`: Generate titles from conversation
- `createPayload()`: Service-specific request formatting
- `handleAPIError()`: Service-specific error handling

**Service Detection:**
- Model prefixes: `ollama@`, `gemini@`, `anthropic@`, `lmstudio@`, `openrouter@`
- URL patterns for each service
- API key availability for fallback selection
- Detection logic in `src/Services/AiService.ts:aiProviderFromUrl()`

**Available Services:**
- OpenAI (`src/Services/OpenAiService.ts`)
- Anthropic (`src/Services/AnthropicService.ts`) - Custom system message handling
- Gemini (`src/Services/GeminiService.ts`) - Dynamic URL generation, SSE streaming
- Ollama (`src/Services/OllamaService.ts`) - No API key required
- OpenRouter (`src/Services/OpenRouterService.ts`)
- LmStudio (`src/Services/LmStudioService.ts`)

### Core Services

- **ApiService** (`src/Services/ApiService.ts`): HTTP request handling (streaming/non-streaming)
- **ApiAuthService** (`src/Services/ApiAuthService.ts`): Authentication headers per service
- **ApiResponseParser** (`src/Services/ApiResponseParser.ts`): Parse streaming/non-streaming responses
- **EditorService** (`src/Services/EditorService.ts`): Obsidian editor interactions
- **MessageService** (`src/Services/MessageService.ts`): Chat message processing
- **FrontmatterService** (`src/Services/FrontmatterService.ts`): YAML frontmatter with provider-specific defaults
- **SettingsService** (`src/Services/SettingsService.ts`): Global and provider-specific settings
- **TemplateService** (`src/Services/TemplateService.ts`): Chat templates
- **ErrorService** (`src/Services/ErrorService.ts`): Centralized error handling
- **NotificationService** (`src/Services/NotificationService.ts`): User notifications

### Configuration System

**Three-tier configuration:**
1. **Global Settings**: Stored via Obsidian's settings API in `SettingsService`
2. **Provider-Specific Defaults**: Each service has `DEFAULT_X_CONFIG` (v2.7.0+)
3. **Per-Note Config**: YAML frontmatter overrides in individual notes

**Configuration Interfaces:**
- `ChatGPT_MDSettings` (`src/Models/Config.ts`): Main settings interface
- `ApiKeySettings`: API keys for all services
- `ServiceUrlSettings`: URLs for all services
- Service-specific config interfaces (e.g., `OpenAiConfig`, `AnthropicConfig`)

### Key Constants

`src/Constants.ts` contains:
- Service identifiers (`AI_SERVICE_OPENAI`, `AI_SERVICE_ANTHROPIC`, etc.)
- API endpoints mapping for each service
- Command IDs
- Error messages
- Plugin system message template
- Regex patterns for links
- Default configuration values

## Adding New AI Services

**Comprehensive guide:** See `docs/CREATE_SERVICE.md` for full step-by-step instructions.

**High-level steps:**
1. Create service constant in `Constants.ts`
2. Implement service class extending `BaseAiService` in `src/Services/YourService.ts`
3. Update config interfaces in `src/Models/Config.ts`
4. Add authentication logic to `ApiAuthService`
5. Add response parsing to `ApiResponseParser`
6. Register in `ServiceLocator.getAiApiService()`
7. Update model detection in `AiService.ts:aiProviderFromUrl()`
8. Add settings UI in `ChatGPT_MDSettingsTab.ts`
9. Update `FrontmatterService` with default config
10. Update `CommandRegistry` for model fetching

**Reference implementations:**
- Simple: `OpenAiService.ts`
- Custom auth: `AnthropicService.ts`
- Complex parsing: `GeminiService.ts`
- Local service: `OllamaService.ts`

## Build System

- **Bundler**: ESBuild (`esbuild.config.mjs`)
- **TypeScript**: Strict type checking (`tsconfig.json`)
- **Linting**: ESLint with TypeScript plugin (`eslint.config.js`)
- **Entry Point**: `src/main.ts`
- **Output**: `main.js` (bundled for Obsidian)
- **External Dependencies**: Obsidian API, CodeMirror, Electron (not bundled)

**Production optimizations:**
- Tree shaking enabled
- Console statements removed (`drop: ["console", "debugger"]`)
- Aggressive minification (whitespace, identifiers, syntax)
- Source maps only in development

**Bundle size targets:**
- Optimal: < 50 KB
- Warning: 50-100 KB
- Critical: > 100 KB (requires optimization)

## Project Structure

```
src/
├── main.ts                    # Plugin entry point
├── Constants.ts               # Service constants, API endpoints, defaults
├── core/
│   ├── ServiceLocator.ts      # Dependency injection container
│   └── CommandRegistry.ts     # Command registration & model management
├── Services/                  # All service implementations
│   ├── AiService.ts           # Base class & IAiApiService interface
│   ├── OpenAiService.ts       # OpenAI implementation
│   ├── AnthropicService.ts    # Anthropic implementation
│   ├── GeminiService.ts       # Google Gemini implementation
│   ├── OllamaService.ts       # Ollama (local) implementation
│   ├── OpenRouterService.ts   # OpenRouter implementation
│   ├── LmStudioService.ts     # LM Studio implementation
│   ├── ApiService.ts          # HTTP request handling
│   ├── ApiAuthService.ts      # Authentication per service
│   ├── ApiResponseParser.ts   # Response parsing per service
│   ├── EditorService.ts       # Editor interactions
│   ├── MessageService.ts      # Message processing
│   ├── FrontmatterService.ts  # Frontmatter management
│   ├── SettingsService.ts     # Settings management
│   ├── TemplateService.ts     # Template handling
│   ├── ErrorService.ts        # Error handling
│   └── NotificationService.ts # User notifications
├── Models/
│   ├── Config.ts              # Configuration interfaces
│   └── Message.ts             # Message model
├── Views/                     # UI components
│   ├── ChatGPT_MDSettingsTab.ts
│   ├── AiModelSuggestModal.ts
│   ├── ChatTemplatesSuggestModal.ts
│   └── FolderCreationModal.ts
└── Utilities/                 # Helper functions
    ├── TextHelpers.ts
    └── ModalHelpers.ts
```

## Development Workflow

1. **Starting Development**:
   ```bash
   yarn dev  # Starts watch mode
   ```
   - Make changes to TypeScript files in `src/`
   - ESBuild automatically rebuilds `main.js`
   - Reload Obsidian to test changes

2. **Code Quality**:
   ```bash
   yarn lint      # Check for issues
   yarn lint:fix  # Auto-fix issues
   ```

3. **Before Committing**:
   ```bash
   yarn build     # Ensure production build works
   ```

4. **Testing Changes**:
   - Load plugin in Obsidian (enable in Community Plugins)
   - Test with different AI services
   - Test streaming and non-streaming modes
   - Test frontmatter overrides
   - Check error handling

## Important Implementation Details

### Service Type Detection

The `aiProviderFromUrl()` function in `src/Services/AiService.ts` determines which AI service to use based on:
1. Model prefix (e.g., `ollama@llama3.2`)
2. Model name patterns (e.g., "claude", "gemini")
3. URL patterns (e.g., "openrouter.ai", "anthropic.com")
4. API key availability (fallback)

### Streaming vs Non-Streaming

Both modes are supported for all services:
- **Streaming**: Real-time response display in editor via Server-Sent Events (SSE)
- **Non-streaming**: Complete response returned at once
- Controlled by `stream` parameter in frontmatter/settings

### Plugin System Message

All AI services receive a plugin system message (`PLUGIN_SYSTEM_MESSAGE` in Constants.ts) that helps the LLM understand:
- Obsidian context
- Markdown formatting requirements
- Code block formatting (3 backticks, language specification)
- Inline code with single backticks
- Table formatting without code blocks

Services handle this differently:
- Most services: Added as first message with service-specific role
- Anthropic: Uses separate `system` field in payload

### Error Handling

Centralized through `ErrorService`:
- Network errors (connection issues)
- Authentication errors (401, invalid API keys)
- Rate limiting (429)
- Model not found (404)
- Token limit errors (handled with truncation warnings)
- Service-specific errors

## Common Development Tasks

### Adding a New Command
1. Add command ID to `src/Constants.ts`
2. Register command in `src/core/CommandRegistry.ts`
3. Implement command logic using services from ServiceLocator
4. Test command in Obsidian

### Adding a New Configuration Option
1. Add to settings interface in `src/Models/Config.ts`
2. Add default value to `DEFAULT_SETTINGS`
3. Add UI field in `src/Views/ChatGPT_MDSettingsTab.ts`
4. Use via `SettingsService.getSettings()`

### Modifying Frontmatter Behavior
1. Update `src/Services/FrontmatterService.ts`
2. Update provider-specific defaults if needed
3. Test with per-note frontmatter overrides

### Debugging
- Check browser/Electron developer console in Obsidian
- Look for `[ChatGPT MD]` prefixed log messages
- Use `yarn dev` for source maps
- Test with minimal settings first

## Additional Documentation

- **CREATE_SERVICE.md**: Complete guide for adding new AI services
- **BUILD_OPTIMIZATION.md**: Bundle optimization strategies
- **VERSION_MANAGEMENT.md**: Version bumping and release process

## Notes for Future Development

- No test files currently in the project (manual testing required)
- Bundle size should be monitored (currently ~57 KB)
- All services use factory pattern through ServiceLocator
- Provider detection is model-prefix based (e.g., `ollama@`, `gemini@`)
- Backward compatibility maintained for legacy model names
- Settings migrations handled on plugin load
