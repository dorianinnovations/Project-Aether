/**
 * BasicMarkdown - Simple, reliable markdown for bot messages
 * Handles: bold, lists, basic formatting with colors
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { getCyclingPastelColor } from '../../tokens/colors';

interface BasicMarkdownProps {
  children: string;
  theme?: 'light' | 'dark';
  style?: any;
}

const BasicMarkdown: React.FC<BasicMarkdownProps> = ({ children, theme = 'light', style = {} }) => {
  const renderText = () => {
    // Split by newlines
    let lines = children.split('\n');
    
    // If no newlines, try to split by list patterns but be more careful
    if (lines.length === 1) {
      // Split more carefully to avoid mixing list types
      lines = children.split(/(?=\n)|(?=- [^0-9])|(?=\d+\.\s[^0-9])/).filter(line => line.trim());
    }
    
    // Clean up lines but preserve list type separation
    lines = lines.map(line => {
      let cleaned = line.trim();
      
      // Only convert * bullets to - bullets, never mix with numbers
      if (cleaned.startsWith('* ') && !/^\d/.test(cleaned.substring(2))) {
        cleaned = cleaned.replace(/^\*\s/, '- ');
      }
      
      // Remove standalone asterisks only
      if (/^\*+$/.test(cleaned)) {
        return '';
      }
      
      return cleaned;
    }).filter(line => line);
    
    const elements: React.ReactNode[] = [];
    let colorIndex = 0;

    lines.forEach((line, index) => {
      // STRICT: Numbered lists ONLY - must start with digit, period, space, NON-digit
      if (/^\d+\.\s[^0-9]/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.+)/);
        if (match) {
          const number = match[1];
          const text = match[2];
          const numberColor = getCyclingPastelColor(colorIndex++, theme);
          
          elements.push(
            <View key={index} style={styles.listItem}>
              <Text style={[styles.numberBullet, { color: numberColor }]}>
                {number}.
              </Text>
              <View style={styles.listTextContainer}>
                <Text style={[styles.text, style]}>
                  {formatInlineText(text, theme)}
                </Text>
              </View>
            </View>
          );
        }
      }
      // STRICT: Bullet lists ONLY - must start with dash, space, NON-digit
      else if (/^-\s[^0-9]/.test(line)) {
        const text = line.substring(2);
        const bulletColor = getCyclingPastelColor(colorIndex++, theme);
        
        elements.push(
          <View key={index} style={styles.listItem}>
            <Text style={[styles.bullet, { color: bulletColor }]}>
              •
            </Text>
            <View style={styles.listTextContainer}>
              <Text style={[styles.bulletText, style]}>
                {formatInlineText(text, theme)}
              </Text>
            </View>
          </View>
        );
      }
      // Regular text
      else if (line.trim()) {
        elements.push(
          <View key={index} style={styles.paragraphContainer}>
            <Text style={[styles.text, style]}>
              {formatInlineText(line, theme)}
            </Text>
          </View>
        );
      }
      // Empty line
      else {
        elements.push(<View key={index} style={styles.emptyLine} />);
      }
    });

    return elements;
  };

  const formatInlineText = (text: string, theme: 'light' | 'dark') => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold text **text**
      const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/);
      if (boldMatch) {
        if (boldMatch[1]) {
          parts.push(<Text key={key++}>{boldMatch[1]}</Text>);
        }
        parts.push(
          <Text key={key++} style={{ fontWeight: 'bold', fontFamily: 'Nunito-Bold' }}>
            {boldMatch[2]}
          </Text>
        );
        remaining = boldMatch[3];
        continue;
      }

      // Code text `text`
      const codeMatch = remaining.match(/^(.*?)`(.*?)`(.*)/);
      if (codeMatch) {
        if (codeMatch[1]) {
          parts.push(<Text key={key++}>{codeMatch[1]}</Text>);
        }
        parts.push(
          <Text key={key++} style={{ 
            fontFamily: 'Courier',
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 4,
            fontSize: 14
          }}>
            {codeMatch[2]}
          </Text>
        );
        remaining = codeMatch[3];
        continue;
      }

      // No formatting found
      parts.push(<Text key={key++}>{remaining}</Text>);
      break;
    }

    return parts;
  };

  return <View>{renderText()}</View>;
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1,
    marginLeft: 2,
    paddingLeft: 0,
    paddingRight: 0,
  },
  bullet: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
    marginTop: 1,
    lineHeight: 24,
    width: 14,
  },
  numberBullet: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
    marginTop: 1,
    lineHeight: 24,
    minWidth: 18,
  },
  listTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  paragraphContainer: {
    marginVertical: 3,
    paddingHorizontal: 0,
  },
  text: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.2,
    fontFamily: 'Nunito-Regular',
  },
  bulletText: {
    fontSize: 19,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  emptyLine: {
    height: 12,
  },
});

export default BasicMarkdown;