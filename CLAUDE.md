# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm start                    # Start Expo development server
npm run android             # Run on Android emulator
npm run ios                 # Run on iOS simulator
npm run web                 # Run on web browser
```

### Code Quality
```bash
npm run typecheck           # Run TypeScript type checking (use this frequently)
npm run lint               # Run ESLint code analysis
npm test                   # Run Jest unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate test coverage report
```

### Single Test Execution
```bash
npm test -- --testNamePattern="specific test name"
npm test -- src/__tests__/specific-file.test.tsx
```

## Architecture Overview

### Design System Foundation
This codebase follows **atomic design principles** with a sophisticated design system:
- **Atoms** (`src/design-system/components/atoms/`): Basic UI elements (buttons, inputs, icons)
- **Molecules** (`src/design-system/components/molecules/`): Component combinations (chat bubbles, cards)  
- **Organisms** (`src/design-system/components/organisms/`): Complex UI sections (headers, modals)
- **Design Tokens** (`src/design-system/tokens/`): Centralized styling system with colors, spacing, typography

### State Architecture
- **Global State**: React Context API for theme, settings, authentication
- **Theme System**: Dual-theme support (light/dark) with glassmorphic and neumorphic effects
- **Settings**: Persistent storage using AsyncStorage with centralized context

### API Integration Pattern
- **Base API**: `src/services/api.ts` contains centralized axios instance with authentication
- **Streaming Chat**: Real-time Server-Sent Events (SSE) for AI conversations
- **Error Handling**: Comprehensive error boundaries and retry logic
- **Backend URL**: https://server-a7od.onrender.com (Render.com deployment)

### Key Architectural Decisions

#### Conversation Management
- **ConversationDrawer.tsx** (1,715 lines): Complex conversation history with delete/clear functionality
- **Message Streaming**: Uses SSE for real-time AI responses with typing indicators
- **Message Storage**: Local conversation caching with server synchronization

#### Screen Architecture
- **ChatScreen.tsx**: Core chat interface with streaming, animations, keyboard handling
- **Auth Screens**: SignIn/SignUp with comprehensive validation and error handling  
- **InsightsScreen.tsx**: Analytics dashboard with emotional metrics visualization
- **ProfileScreen.tsx**: User profile management with avatar upload functionality
- **SocialScreen** (Modular): Advanced social platform with modular architecture (see Social Architecture section)

#### Enhanced Components
- **EnhancedMessageBubble**: Sophisticated message rendering with markdown, themes, and animations
- **EnhancedChatInput**: Advanced input with attachments, voice recording, and file upload
- **HeaderMenu**: Animated dropdown with glassmorphic effects

### Styling System
- **Theme Colors**: Extensive pastel color palette with semantic color mapping
- **Glassmorphism**: Blur and transparency effects throughout the UI
- **Neumorphism**: Subtle shadow and depth effects for modern feel
- **Animation**: React Native Reanimated for smooth micro-interactions

### New Organized Structure (Recently Added)
- **`src/types/`**: Centralized TypeScript interfaces and type definitions
- **`src/utils/`**: Shared utilities (formatting, validation, storage, navigation, theme)
- **`src/constants/`**: App-wide configuration, API endpoints, and constants
- **`src/hooks/`**: Custom React hooks (theme, settings, keyboard management)

### Testing Strategy
- **Integration Tests**: User flow testing in `src/__tests__/integration/`
- **Component Tests**: Screen-level testing with React Native Testing Library
- **Unit Tests**: Utility function testing and service testing

### Performance Considerations
- **FlatList Optimization**: Conversation history uses optimized rendering
- **Image Caching**: Lazy loading and caching for profile pictures
- **Bundle Optimization**: Code splitting and memory leak prevention
- **Animation Performance**: Native driver usage for 60fps animations

### Social Architecture (Modular Design)
The social platform has been architected using a modular approach for maximum scalability and maintainability:

#### Directory Structure
```
src/screens/social/
├── components/           # Reusable UI components (Atomic Design)
│   ├── TabPills.tsx     # Tab navigation molecule  
│   ├── PostCard.tsx     # Individual post display molecule
│   ├── PostsFeed.tsx    # Posts list organism
│   ├── CreatePostModal.tsx # Post creation modal organism
│   ├── CommunityChip.tsx   # Community selection atom
│   └── index.ts         # Component exports
├── hooks/               # Custom React hooks for data management
│   ├── useSocialData.ts    # Posts loading, caching, auto-refresh
│   ├── useRealTimeUpdates.ts # Server-Sent Events integration
│   ├── usePostActions.ts   # Like/share/comment with optimistic updates
│   └── index.ts         # Hook exports
├── types/               # TypeScript interfaces
├── constants/           # Static data (communities, colors, tabs)
├── utils/               # Helper functions (color getters, filtering)
└── SocialScreen.tsx     # Main container (220 lines vs original 1,521)
```

#### Key Architectural Benefits
- **Separation of Concerns**: Business logic isolated in custom hooks
- **Component Reusability**: Atomic design enables easy composition
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Real-time Updates**: SSE integration with optimistic UI updates
- **Performance**: Better code splitting and render optimization
- **Scalability**: Easy to add features without touching existing code

#### Social Features
- **Real-time Feed**: Server-Sent Events for live post updates
- **Post Management**: Create, like, share, comment with optimistic updates
- **Community System**: Categorized posts with color-coded communities
- **Tab Navigation**: Feed, Groups, Strategize, Collaborate sections
- **Search & Filter**: Real-time post filtering and search
- **Engagement Actions**: Like, comment, share with haptic feedback

#### Migration Pattern
The original monolithic `ConnectionsScreen.tsx` (1,521 lines) was refactored into the modular architecture while maintaining backward compatibility through re-exports. This pattern can be applied to other large components.

## Critical Notes for Development

### API Service Usage
Always use the centralized API service in `src/services/api.ts`. It handles:
- Authentication token management
- Request/response interceptors
- Error handling and retry logic
- Base URL configuration

### Design System Compliance
- Use design tokens from `src/design-system/tokens/` for all styling
- Follow atomic design patterns when creating new components
- Maintain theme support (light/dark) for all new UI elements
- Use the established color palette and spacing system

### Message/Chat Development
- Streaming responses use Server-Sent Events (SSE) pattern
- All chat functionality integrates with the conversation management system
- Message rendering supports markdown with custom styling
- Maintain conversation history synchronization with backend

### Social Platform Development
When working with the social platform (`src/screens/social/`):
- **Use Custom Hooks**: Leverage `useSocialData`, `useRealTimeUpdates`, and `usePostActions` for data management
- **Component Composition**: Build new features by composing existing atoms and molecules
- **Real-time Integration**: Utilize Server-Sent Events for live updates via `useRealTimeUpdates`
- **Optimistic Updates**: Implement optimistic UI updates for better user experience
- **Type Safety**: All components must use the TypeScript interfaces from `types/index.ts`
- **Constants**: Use predefined colors, communities, and configurations from `constants/`
- **Modular Architecture**: Keep components focused and single-responsibility
- **Performance**: Consider code splitting and lazy loading for new organisms

### Code Quality Requirements
- All code must pass TypeScript strict mode compilation
- ESLint configuration enforces React Native best practices
- Component props must be properly typed with TypeScript interfaces
- Maintain test coverage for new functionality

This is a production-grade React Native application with sophisticated architecture, comprehensive testing, and professional development practices.