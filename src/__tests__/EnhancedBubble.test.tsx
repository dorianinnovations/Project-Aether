/**
 * Minimal test for EnhancedBubble markdown integration
 * Tests that streaming messages get markdown formatting when complete
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import EnhancedBubble from '../design-system/components/molecules/EnhancedBubble';

// Mock dependencies
jest.mock('../design-system/tokens/colors', () => ({
  designTokens: {},
  getThemeColors: jest.fn(() => ({})),
  getUserMessageColor: jest.fn(() => '#0066cc'),
  getStandardBorder: jest.fn(() => ({})),
  getCyclingPastelColor: jest.fn(() => '#0066cc'),
}));

jest.mock('../design-system/tokens/typography', () => ({
  typography: {
    textStyles: {
      body: { fontSize: 16 }
    }
  }
}));

jest.mock('../design-system/tokens/spacing', () => ({
  spacing: [0, 4, 8, 12, 16, 20, 24, 32],
  borderRadius: { sm: 4 }
}));

jest.mock('../design-system/tokens/shadows', () => ({
  getNeumorphicStyle: jest.fn(() => ({})),
}));

jest.mock('../design-system/tokens/glassmorphism', () => ({
  getGlassmorphicStyle: jest.fn(() => ({})),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }
}));

jest.mock('lottie-react-native', () => 'LottieView');

const mockMessage = {
  id: 'test-1',
  text: 'Test message with **bold** text and `code`',
  sender: 'numina' as const,
  timestamp: new Date().toISOString(),
  variant: 'default' as const
};

describe('EnhancedBubble Markdown Integration', () => {
  it('applies markdown formatting to completed streaming messages', () => {
    const { getByText } = render(
      <EnhancedBubble
        message={mockMessage}
        index={0}
        theme="light"
      />
    );
    
    // Should render markdown-formatted content
    expect(getByText('bold')).toBeTruthy();
    expect(getByText('code')).toBeTruthy();
    expect(getByText('Test message with ')).toBeTruthy();
    expect(getByText(' text and ')).toBeTruthy();
  });

  it('shows search results metadata when available', () => {
    const messageWithSearch = {
      ...mockMessage,
      metadata: {
        searchResults: true,
        query: 'test query',
        sources: [
          {
            title: 'Test Source',
            url: 'https://example.com',
            domain: 'example.com'
          }
        ]
      }
    };

    const { getByText } = render(
      <EnhancedBubble
        message={messageWithSearch}
        index={0}
        theme="light"
      />
    );
    
    expect(getByText(/Search Results for "test query"/)).toBeTruthy();
    expect(getByText('Test Source')).toBeTruthy();
    expect(getByText('example.com')).toBeTruthy();
  });

  it('displays streaming cursor for active streaming messages', () => {
    const streamingMessage = {
      ...mockMessage,
      variant: 'streaming' as const,
      text: 'Partial message'
    };

    const { getByText } = render(
      <EnhancedBubble
        message={streamingMessage}
        index={0}
        theme="light"
      />
    );
    
    // Should show streaming cursor
    expect(getByText('Partial message|')).toBeTruthy();
  });

  it('handles user messages without markdown', () => {
    const userMessage = {
      ...mockMessage,
      sender: 'user' as const,
      text: 'User message with **bold** that should not be formatted'
    };

    const { getByText } = render(
      <EnhancedBubble
        message={userMessage}
        index={0}
        theme="light"
      />
    );
    
    // User messages should show raw text, not formatted
    expect(getByText('User message with **bold** that should not be formatted')).toBeTruthy();
  });

  it('works with dark theme', () => {
    const { getByText } = render(
      <EnhancedBubble
        message={mockMessage}
        index={0}
        theme="dark"
      />
    );
    
    expect(getByText('bold')).toBeTruthy();
    expect(getByText('code')).toBeTruthy();
  });
});