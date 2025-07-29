/**
 * Aether - MarkdownText Component
 * Simple markdown formatting for Aether responses
 */

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { typography } from '../../tokens/typography';
import { designTokens } from '../../tokens/colors';

interface MarkdownTextProps {
  children: string;
  style?: TextStyle;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ children, style = {} }) => {
  // Simple markdown parsing for basic formatting
  const parseMarkdown = (text: string) => {
    const parts: Array<{ text: string; style?: TextStyle }> = [];
    let currentIndex = 0;

    // Bold text (**text**)
    let boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > currentIndex) {
        parts.push({ text: text.slice(currentIndex, match.index) });
      }
      
      // Add bold text
      parts.push({ 
        text: match[1], 
        style: { fontWeight: '600' as const } 
      });
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push({ text: text.slice(currentIndex) });
    }

    return parts;
  };

  const renderText = () => {
    const parts = parseMarkdown(children);
    
    return (
      <Text style={[styles.baseText, style]}>
        {parts.map((part, index) => (
          <Text key={index} style={part.style}>
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  return renderText();
};

const styles = StyleSheet.create({
  baseText: {
    ...typography.textStyles.aiMessage,
    lineHeight: 24,
  },
});

export default MarkdownText;