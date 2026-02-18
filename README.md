# OpenGnothia

**"Know Thyself"** - AI-powered self-therapy desktop application.

OpenGnothia is a privacy-focused desktop app that helps you explore your inner world through AI-assisted therapy sessions, journaling, and dream analysis. All your data stays on your device.

## Features

- **AI Therapy Sessions** - Chat with AI using various therapy school approaches (CBT, Psychoanalysis, Gestalt, etc.)
- **Journal** - Write and reflect on your daily thoughts
- **Dream Analysis** - Record and explore your dreams with AI assistance
- **Insights** - AI-generated insights from your sessions and journal entries
- **Therapy Programs** - Structured therapy programs to guide your self-discovery
- **Multi-provider AI Support** - Works with Anthropic Claude, OpenAI, and custom API endpoints
- **Privacy First** - All data stored locally on your device using SQLite
- **Biometric Lock** - Secure your app with password or Touch ID (macOS)
- **Multi-language** - Available in English and Turkish

## Tech Stack

- **Frontend**: React 19 + TypeScript + TailwindCSS
- **Desktop**: Tauri 2
- **Backend**: Rust
- **Database**: SQLite
- **State Management**: Zustand

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI prerequisites](https://v2.tauri.app/start/prerequisites/)

## Installation

```bash
# Clone the repository
git clone https://github.com/Lepuz-coder/opengnothia.git
cd opengnothia

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Configuration

On first launch, the app will guide you through an onboarding process where you can:

1. Select your preferred AI provider (Anthropic, OpenAI, or custom)
2. Enter your API key
3. Choose a therapy school approach

Your API keys are stored securely on your device and never sent anywhere except to the AI provider you selected.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
