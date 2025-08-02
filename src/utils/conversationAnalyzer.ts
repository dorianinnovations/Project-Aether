/**
 * Conversation Context Analyzer
 * Intelligently analyzes conversation patterns to generate contextual prompts
 */

import { ConversationContext } from './promptTemplates';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

/**
 * Analyzes conversation to extract context for dynamic prompt generation
 */
export class ConversationAnalyzer {
  private static readonly TOPIC_KEYWORDS = {
    // Professional/Career
    career: ['job', 'work', 'career', 'professional', 'business', 'startup', 'company', 'industry'],
    // Personal Development
    growth: ['improve', 'develop', 'learn', 'skill', 'habit', 'goal', 'challenge', 'growth'],
    // Relationships
    relationships: ['relationship', 'family', 'friend', 'partner', 'social', 'connection', 'communication'],
    // Philosophy/Meaning
    philosophy: ['meaning', 'purpose', 'values', 'belief', 'philosophy', 'ethics', 'morality', 'existence'],
    // Health/Wellness
    wellness: ['health', 'fitness', 'mental', 'wellness', 'stress', 'anxiety', 'balance', 'mindfulness'],
    // Creativity/Arts
    creativity: ['creative', 'art', 'design', 'music', 'writing', 'innovation', 'imagination'],
    // Technology/Future
    technology: ['technology', 'AI', 'future', 'digital', 'innovation', 'automation', 'data'],
    // Finance/Resources
    finance: ['money', 'financial', 'investment', 'budget', 'wealth', 'economic', 'resource']
  };

  private static readonly EMOTIONAL_INDICATORS = {
    analytical: ['analyze', 'data', 'logic', 'rational', 'systematic', 'evidence', 'research'],
    reflective: ['think', 'reflect', 'consider', 'ponder', 'meditate', 'contemplate', 'introspect'],
    curious: ['wonder', 'explore', 'discover', 'question', 'investigate', 'learn', 'understand'],
    challenged: ['difficult', 'struggle', 'problem', 'issue', 'challenge', 'obstacle', 'conflict'],
    excited: ['excited', 'enthusiastic', 'passionate', 'love', 'amazing', 'incredible', 'fantastic']
  };

  /**
   * Main analysis function - converts messages into conversation context
   */
  static analyze(messages: Message[]): ConversationContext {
    // Safety check for valid messages
    if (!messages || messages.length === 0) {
      return {
        topics: [],
        emotionalTone: 'curious',
        complexity: 'surface',
        recentThemes: [],
        userStyle: 'exploratory',
        conversationLength: 0
      };
    }

    const userMessages = messages.filter(m => m && m.sender === 'user' && m.text);
    const recentMessages = messages.slice(-10); // Last 10 messages for recency
    
    return {
      topics: this.extractTopics(userMessages),
      emotionalTone: this.analyzeEmotionalTone(userMessages),
      complexity: this.assessComplexity(userMessages),
      recentThemes: this.extractRecentThemes(recentMessages),
      userStyle: this.determineUserStyle(userMessages),
      conversationLength: messages.length
    };
  }

  /**
   * Extract main topics from conversation
   */
  private static extractTopics(messages: Message[]): string[] {
    const allText = messages
      .filter(m => m && m.text && typeof m.text === 'string')
      .map(m => m.text.toLowerCase())
      .join(' ');
    const topicScores: { [key: string]: number } = {};

    // Score each topic based on keyword frequency
    Object.entries(this.TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
      topicScores[topic] = keywords.reduce((score, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = allText.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0);
    });

    // Return top 3 topics
    return Object.entries(topicScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .filter(([,score]) => score > 0)
      .map(([topic]) => topic);
  }

  /**
   * Analyze emotional tone of conversation
   */
  private static analyzeEmotionalTone(messages: Message[]): ConversationContext['emotionalTone'] {
    const recentText = messages
      .slice(-5)
      .filter(m => m && m.text && typeof m.text === 'string')
      .map(m => m.text.toLowerCase())
      .join(' ');
    const emotionScores: { [key: string]: number } = {};

    Object.entries(this.EMOTIONAL_INDICATORS).forEach(([emotion, indicators]) => {
      emotionScores[emotion] = indicators.reduce((score, indicator) => {
        const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
        const matches = recentText.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0);
    });

    const dominantEmotion = Object.entries(emotionScores)
      .sort(([,a], [,b]) => b - a)[0];

    return (dominantEmotion?.[0] as ConversationContext['emotionalTone']) || 'curious';
  }

  /**
   * Assess conversation complexity level
   */
  private static assessComplexity(messages: Message[]): ConversationContext['complexity'] {
    const totalWords = messages
      .filter(m => m && m.text && typeof m.text === 'string')
      .reduce((count, m) => count + m.text.split(' ').length, 0);
    const avgWordsPerMessage = totalWords / Math.max(messages.length, 1);
    
    // Check for complexity indicators
    const complexityWords = [
      'however', 'nevertheless', 'furthermore', 'consequently', 'specifically',
      'paradox', 'nuance', 'complexity', 'multifaceted', 'interconnected',
      'systematic', 'philosophical', 'theoretical', 'abstract', 'conceptual'
    ];
    
    const allText = messages
      .filter(m => m && m.text && typeof m.text === 'string')
      .map(m => m.text.toLowerCase())
      .join(' ');
    const complexityScore = complexityWords.reduce((score, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = allText.match(regex);
      return score + (matches ? matches.length : 0);
    }, 0);

    if (complexityScore > 5 || avgWordsPerMessage > 30) {
      return 'deep';
    } else if (complexityScore > 2 || avgWordsPerMessage > 15) {
      return 'intermediate';
    } else {
      return 'surface';
    }
  }

  /**
   * Extract themes from recent messages
   */
  private static extractRecentThemes(recentMessages: Message[]): string[] {
    const userText = recentMessages
      .filter(m => m && m.sender === 'user' && m.text && typeof m.text === 'string')
      .map(m => m.text.toLowerCase())
      .join(' ');

    // Extract noun phrases and important concepts
    const themePatterns = [
      /\b(\w+ing)\b/g, // Present participles (learning, building, etc.)
      /\b(how to \w+)\b/g, // How-to phrases
      /\b(\w+ \w+ment)\b/g, // -ment words (development, improvement)
      /\b(\w+ \w+tion)\b/g, // -tion words (creation, innovation)
    ];

    const themes: string[] = [];
    themePatterns.forEach(pattern => {
      const matches = userText.match(pattern);
      if (matches) {
        themes.push(...matches.slice(0, 2)); // Max 2 per pattern
      }
    });

    return themes.slice(0, 3); // Max 3 themes
  }

  /**
   * Determine user's conversation style
   */
  private static determineUserStyle(messages: Message[]): ConversationContext['userStyle'] {
    const userText = messages
      .filter(m => m && m.text && typeof m.text === 'string')
      .map(m => m.text.toLowerCase())
      .join(' ');
    
    const styleIndicators = {
      direct: ['what', 'how', 'when', 'give me', 'I need', 'specific', 'exactly'],
      exploratory: ['maybe', 'perhaps', 'I wonder', 'what if', 'explore', 'discover'],
      philosophical: ['why', 'meaning', 'purpose', 'essence', 'fundamental', 'deeper'],
      practical: ['use', 'apply', 'implement', 'practical', 'action', 'steps', 'do']
    };

    const styleScores: { [key: string]: number } = {};
    
    Object.entries(styleIndicators).forEach(([style, indicators]) => {
      styleScores[style] = indicators.reduce((score, indicator) => {
        const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
        const matches = userText.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0);
    });

    const dominantStyle = Object.entries(styleScores)
      .sort(([,a], [,b]) => b - a)[0];

    return (dominantStyle?.[0] as ConversationContext['userStyle']) || 'exploratory';
  }

  /**
   * Quick context update for real-time analysis
   */
  static updateContext(
    currentContext: ConversationContext, 
    newMessage: Message
  ): ConversationContext {
    // For performance, we do incremental updates for new messages
    // Full re-analysis happens less frequently
    
    if (newMessage.sender === 'user') {
      const messageTopics = this.extractTopics([newMessage]);
      const updatedTopics = [...currentContext.topics];
      
      // Add new topics if they're not already present
      messageTopics.forEach(topic => {
        if (!updatedTopics.includes(topic)) {
          updatedTopics.push(topic);
        }
      });

      return {
        ...currentContext,
        topics: updatedTopics.slice(0, 3), // Keep max 3
        conversationLength: currentContext.conversationLength + 1
      };
    }

    return {
      ...currentContext,
      conversationLength: currentContext.conversationLength + 1
    };
  }
}