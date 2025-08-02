/**
 * Minimal test for BasicMarkdown component
 * Tests markdown formatting without heavy dependencies
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import BasicMarkdown from '../design-system/components/atoms/BasicMarkdown';

// Mock the color utility since it's not needed for markdown logic
jest.mock('../design-system/tokens/colors', () => ({
  getCyclingPastelColor: jest.fn(() => '#0066cc'),
}));

describe('BasicMarkdown', () => {
  it('renders plain text correctly', () => {
    const { getByText } = render(
      <BasicMarkdown theme="light">
        Hello world
      </BasicMarkdown>
    );
    
    expect(getByText('Hello world')).toBeTruthy();
  });

  it('renders bold text correctly', () => {
    const { getByText } = render(
      <BasicMarkdown theme="light">
        This is **bold text** in a sentence
      </BasicMarkdown>
    );
    
    // Should find the bold text
    expect(getByText('bold text')).toBeTruthy();
    // Should find the regular text parts too
    expect(getByText('This is ')).toBeTruthy();
    expect(getByText(' in a sentence')).toBeTruthy();
  });

  it('renders simple numbered list correctly', () => {
    const { getByText } = render(
      <BasicMarkdown theme="light">
        1. First item
      </BasicMarkdown>
    );
    
    expect(getByText('1.')).toBeTruthy();
    // Text might include extra formatting, just check it contains the item
    expect(() => getByText(/First item/)).not.toThrow();
  });

  it('renders simple bullet list correctly', () => {
    const { getByText } = render(
      <BasicMarkdown theme="light">
        - First bullet
      </BasicMarkdown>
    );
    
    expect(getByText('•')).toBeTruthy();
    expect(() => getByText(/First bullet/)).not.toThrow();
  });

  it('renders code text correctly', () => {
    const { getByText } = render(
      <BasicMarkdown theme="light">
        Use the `console.log()` function to debug
      </BasicMarkdown>
    );
    
    expect(getByText('console.log()')).toBeTruthy();
    expect(getByText('Use the ')).toBeTruthy();
    expect(getByText(' function to debug')).toBeTruthy();
  });

  it('handles mixed formatting correctly', () => {
    const { getByText, getAllByText } = render(
      <BasicMarkdown theme="light">
        Here is **bold** and `code` text
      </BasicMarkdown>
    );
    
    expect(getByText('bold')).toBeTruthy();
    expect(getByText('code')).toBeTruthy();
    expect(getByText('Here is ')).toBeTruthy();
    expect(getByText(' and ')).toBeTruthy();
    expect(getByText(' text')).toBeTruthy();
  });

  it('handles empty content gracefully', () => {
    const { toJSON } = render(
      <BasicMarkdown theme="light">
        {''}
      </BasicMarkdown>
    );
    
    // Should render without crashing
    expect(toJSON()).toBeTruthy();
  });

  it('works with dark theme', () => {
    const { getByText } = render(
      <BasicMarkdown theme="dark">
        **Bold text** in dark theme
      </BasicMarkdown>
    );
    
    expect(getByText('Bold text')).toBeTruthy();
    expect(getByText(' in dark theme')).toBeTruthy();
  });
});