/**
 * Aether - MarkdownText Component
 * Simple markdown formatting for Aether responses
 */

import React from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';
import { typography } from '../../tokens/typography';
import { designTokens, getCyclingPastelColor } from '../../tokens/colors';

interface MarkdownTextProps {
  children: string;
  style?: TextStyle;
  theme?: 'light' | 'dark';
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ children, style = {}, theme = 'light' }) => {
  // Enhanced markdown parsing with View wrappers for better styling
  const parseMarkdown = (text: string) => {
    const parts: Array<{ text: string; style?: TextStyle; type?: string; containerStyle?: any }> = [];
    let colorIndex = 0;
    const currentIndex = 0;

    // Process each formatting type in order of priority
    const formatText = (inputText: string, startIndex: number = 0): void => {
      if (!inputText) return;

      // Bold text (**text**) - highest priority
      const boldRegex = /\*\*(.*?)\*\*/;
      const boldMatch = boldRegex.exec(inputText);
      
      if (boldMatch) {
        // Add text before bold
        if (boldMatch.index > 0) {
          formatText(inputText.slice(0, boldMatch.index), startIndex);
        }
        
        // Add bold text with rainbow pastel
        const pastelColor = getCyclingPastelColor(colorIndex++, theme);
        parts.push({ 
          text: boldMatch[1], 
          style: {
            fontWeight: '800' as const,
            fontFamily: 'Nunito-ExtraBold',
            color: pastelColor,
            textShadowColor: pastelColor + '30',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
            letterSpacing: -0.3,
          },
          type: 'bold'
        });
        
        // Process remaining text
        const remaining = inputText.slice(boldMatch.index + boldMatch[0].length);
        if (remaining) {
          formatText(remaining, startIndex + boldMatch.index + boldMatch[0].length);
        }
        return;
      }

      // Italic text (*text*)
      const italicRegex = /\*(.*?)\*/;
      const italicMatch = italicRegex.exec(inputText);
      
      if (italicMatch) {
        // Add text before italic
        if (italicMatch.index > 0) {
          formatText(inputText.slice(0, italicMatch.index), startIndex);
        }
        
        // Add italic text
        const pastelColor = getCyclingPastelColor(colorIndex++, theme);
        parts.push({ 
          text: italicMatch[1], 
          style: {
            fontStyle: 'italic' as const,
            fontFamily: 'Nunito-Italic',
            color: pastelColor,
            opacity: 0.9,
          },
          type: 'italic'
        });
        
        // Process remaining text
        const remaining = inputText.slice(italicMatch.index + italicMatch[0].length);
        if (remaining) {
          formatText(remaining, startIndex + italicMatch.index + italicMatch[0].length);
        }
        return;
      }

      // Code blocks (```text```)
      const codeBlockRegex = /```([\s\S]*?)```/;
      const codeBlockMatch = codeBlockRegex.exec(inputText);
      
      if (codeBlockMatch) {
        // Add text before code block
        if (codeBlockMatch.index > 0) {
          formatText(inputText.slice(0, codeBlockMatch.index), startIndex);
        }
        
        // Add code block with clean styling
        parts.push({ 
          text: codeBlockMatch[1], 
          style: {
            fontFamily: 'Nunito-Regular',
            fontWeight: '400' as const,
            color: theme === 'dark' ? '#E0E0E0' : '#2D2D2D',
            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
            paddingHorizontal: 18,
            paddingVertical: 14,
            borderRadius: 8,
            fontSize: 14,
            lineHeight: 20,
            borderLeftWidth: 4,
            borderLeftColor: theme === 'dark' ? '#4A9EFF' : '#2563EB',
            borderWidth: 1,
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
            paddingLeft: 20,
          },
          type: 'codeblock'
        });
        
        // Process remaining text
        const remaining = inputText.slice(codeBlockMatch.index + codeBlockMatch[0].length);
        if (remaining) {
          formatText(remaining, startIndex + codeBlockMatch.index + codeBlockMatch[0].length);
        }
        return;
      }

      // Code text (`text`)
      const codeRegex = /`(.*?)`/;
      const codeMatch = codeRegex.exec(inputText);
      
      if (codeMatch) {
        // Add text before code
        if (codeMatch.index > 0) {
          formatText(inputText.slice(0, codeMatch.index), startIndex);
        }
        
        // Add code text with clean styling
        parts.push({ 
          text: codeMatch[1], 
          style: {
            fontFamily: 'Nunito-Medium',
            fontWeight: '500' as const,
            color: theme === 'dark' ? '#E0E0E0' : '#2D2D2D',
            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            fontSize: 15,
            borderLeftWidth: 3,
            borderLeftColor: theme === 'dark' ? '#4A9EFF' : '#2563EB',
            borderWidth: 1,
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            paddingLeft: 14,
          },
          type: 'code'
        });
        
        // Process remaining text
        const remaining = inputText.slice(codeMatch.index + codeMatch[0].length);
        if (remaining) {
          formatText(remaining, startIndex + codeMatch.index + codeMatch[0].length);
        }
        return;
      }

      // Underline text (_text_)
      const underlineRegex = /_(.*?)_/;
      const underlineMatch = underlineRegex.exec(inputText);
      
      if (underlineMatch) {
        // Add text before underline
        if (underlineMatch.index > 0) {
          formatText(inputText.slice(0, underlineMatch.index), startIndex);
        }
        
        // Add underline text
        const pastelColor = getCyclingPastelColor(colorIndex++, theme);
        parts.push({ 
          text: underlineMatch[1], 
          style: {
            textDecorationLine: 'underline' as const,
            textDecorationColor: pastelColor,
            color: pastelColor,
            fontWeight: '600' as const,
          },
          type: 'underline'
        });
        
        // Process remaining text
        const remaining = inputText.slice(underlineMatch.index + underlineMatch[0].length);
        if (remaining) {
          formatText(remaining, startIndex + underlineMatch.index + underlineMatch[0].length);
        }
        return;
      }

      // Highlight text (~text~)
      const highlightRegex = /~(.*?)~/;
      const highlightMatch = highlightRegex.exec(inputText);
      
      if (highlightMatch) {
        // Add text before highlight
        if (highlightMatch.index > 0) {
          formatText(inputText.slice(0, highlightMatch.index), startIndex);
        }
        
        // Add highlight text
        const pastelColor = getCyclingPastelColor(colorIndex++, theme);
        parts.push({ 
          text: highlightMatch[1], 
          style: {
            backgroundColor: pastelColor + '25',
            color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
            fontWeight: '600' as const,
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderRadius: 3,
          },
          type: 'highlight'
        });
        
        // Process remaining text
        const remaining = inputText.slice(highlightMatch.index + highlightMatch[0].length);
        if (remaining) {
          formatText(remaining, startIndex + highlightMatch.index + highlightMatch[0].length);
        }
        return;
      }

      // No formatting found, add as plain text
      if (inputText) {
        parts.push({ text: inputText });
      }
    };

    formatText(text);
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
    // Base styles now handled via inline props for better control
    // This ensures consistency with the parent component styling
  },
});

export default MarkdownText;