# AetherMobile

A React Native mobile application for AI-powered personal assistance and emotional analytics.

## Project Structure

```
AetherMobile/
├── src/
│   ├── components/
│   │   └── ConversationDrawer.tsx
│   ├── contexts/
│   │   ├── SettingsContext.tsx
│   │   └── ThemeContext.tsx
│   ├── design-system/
│   │   ├── components/
│   │   │   ├── atoms/
│   │   │   │   ├── AnimatedAuthStatus.tsx
│   │   │   │   ├── AnimatedHamburger.tsx
│   │   │   │   ├── BlurModal.tsx
│   │   │   │   ├── DismissibleBanner.tsx
│   │   │   │   ├── Icon.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── LottieLoader.tsx
│   │   │   │   ├── MarkdownText.tsx
│   │   │   │   ├── PageBackground.tsx
│   │   │   │   ├── ScrollToBottomButton.tsx
│   │   │   │   ├── ShimmerText.tsx
│   │   │   │   ├── TechyToggleSwitch.tsx
│   │   │   │   └── Tooltip.tsx
│   │   │   ├── molecules/
│   │   │   │   ├── CompatibilityScore.tsx
│   │   │   │   ├── ConnectionCard.tsx
│   │   │   │   ├── EnhancedChatInput.tsx
│   │   │   │   └── EnhancedMessageBubble.tsx
│   │   │   ├── organisms/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── HeaderMenu.tsx
│   │   │   │   ├── MetricDetailModal.tsx
│   │   │   │   └── SignOutModal.tsx
│   │   │   └── examples/
│   │   │       └── DismissibleBannerExample.tsx
│   │   ├── tokens/
│   │   │   ├── colors.ts
│   │   │   ├── glassmorphism.ts
│   │   │   ├── shadows.ts
│   │   │   ├── spacing.ts
│   │   │   └── typography.ts
│   │   ├── animations/
│   │   │   └── entrance.ts
│   │   └── hooks/
│   │       └── index.ts
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SignInScreen.tsx
│   │   │   └── SignUpScreen.tsx
│   │   ├── chat/
│   │   │   ├── ChatScreen.tsx
│   │   │   └── SettingsModal.tsx
│   │   ├── connections/
│   │   │   └── ConnectionsScreen.tsx
│   │   ├── insights/
│   │   │   └── InsightsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── settingsStorage.ts
│   │   └── utils/
│   └── __tests__/
│       └── integration/
├── assets/
├── docs/
├── App.tsx
├── package.json
└── tsconfig.json
```

## Overview

AetherMobile is a sophisticated React Native application that provides users with an AI-powered personal assistant experience. The platform combines conversational AI, emotional analytics, and social connections to create an adaptive and personalized user experience.

## Core Features

### AI Chat Assistant
- Real-time streaming conversations with AI
- Context-aware responses with personality adaptation
- Support for text, voice, and file attachments
- Message history and conversation management

### Emotional Analytics
- Real-time emotion tracking and analysis
- Personal behavioral pattern insights
- Mood-based AI response adaptation
- Historical emotional data visualization

### Social Connections
- User compatibility scoring and matching
- Connection recommendations based on behavioral patterns
- Social interaction analytics

### User Experience
- Dark/light theme support with smooth transitions
- Glassmorphic and neumorphic design elements
- Advanced animations and micro-interactions
- Responsive design for various screen sizes

## Technical Architecture

### Design System
Built on atomic design principles with a comprehensive component library:
- **Atoms**: Basic UI elements (buttons, inputs, icons)
- **Molecules**: Component combinations (chat bubbles, cards)
- **Organisms**: Complex UI sections (headers, modals, forms)

### State Management
- React Context for global state (theme, settings, authentication)
- Local component state for UI interactions
- Persistent storage for user preferences and conversation history

### Styling System
- Design tokens for consistent theming
- Glassmorphic and neumorphic visual effects
- Responsive spacing and typography scales
- Advanced shadow and blur systems

### API Integration
- RESTful API communication with the backend server
- Real-time streaming for chat responses
- File upload support for attachments
- Comprehensive error handling and retry logic

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Studio

### Installation
```bash
git clone <repository-url>
cd AetherMobile
npm install
```

### Running the Application
```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Testing
```bash
# Run unit tests
npm test

# Run TypeScript checks
npm run type-check

# Run linting
npm run lint
```

## Backend Integration

AetherMobile communicates with a Node.js backend server that provides:
- User authentication and profile management
- AI conversation processing and streaming
- Emotional analytics data collection
- Social connection matching algorithms
- File upload and storage services

## Deployment

The application is configured for deployment through:
- Expo Application Services (EAS) for managed builds
- Over-the-air updates for rapid iteration
- Environment-specific configuration management

## Performance Considerations

- Optimized FlatList rendering for conversation history
- Image caching and lazy loading
- Bundle size optimization and code splitting
- Memory leak prevention for animations and subscriptions

## Security Features

- Secure token-based authentication
- Encrypted local storage for sensitive data
- API request validation and sanitization
- Protected route navigation

## Contributing

This is a solo development project. Code follows TypeScript strict mode with comprehensive ESLint configuration for code quality and consistency.

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **Styling**: StyleSheet with design tokens
- **Animations**: React Native Reanimated
- **State**: React Context API
- **Testing**: Jest with React Native Testing Library
- **Icons**: FontAwesome5, Feather, MaterialCommunityIcons
- **Development**: ESLint, Prettier, TypeScript compiler

## License

Private project - All rights reserved.