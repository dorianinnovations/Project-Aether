/**
 * ChatHeader - Dedicated header component for chat screen
 */
import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { designTokens, getLoadingTextColor } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import Icon from '../atoms/Icon';

interface ChatHeaderProps {
  theme: 'light' | 'dark';
  colors: any;
  isLoading: boolean;
  messageCount: number;
  headerAnim: Animated.Value;
  onConversationHistoryPress: () => void;
  onSettingsPress: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  theme,
  colors,
  isLoading,
  messageCount,
  headerAnim,
  onConversationHistoryPress,
  onSettingsPress,
}) => {
  const glassmorphicHeader = getGlassmorphicStyle('header', theme);
  
  return (
    <Animated.View style={[
      styles.header,
      glassmorphicHeader,
      { opacity: headerAnim }
    ]}>
      {/* Left side - AI Status and Title */}
      <View style={styles.headerLeft}>
        <View style={styles.aiStatus}>
          <View style={[styles.statusDot, { 
            backgroundColor: isLoading 
              ? designTokens.brand.accent 
              : designTokens.semantic.success 
          }]} />
          <Text style={[
            styles.headerTitle, 
            { color: isLoading ? getLoadingTextColor(theme, 'primary') : colors.text }
          ]}>
            Numina
          </Text>
        </View>
        
        <Text style={[
          styles.headerSubtitle, 
          { color: isLoading ? getLoadingTextColor(theme, 'primary') : colors.textSecondary }
        ]}>
          {isLoading 
            ? 'Thinking...' 
            : `${messageCount - 1} messages • Learning your patterns`}
        </Text>
      </View>
      
      {/* Right side - Action Buttons */}
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={onConversationHistoryPress}
          activeOpacity={0.7}
        >
          <Icon 
            name="message-square" 
            size="md" 
            color="muted"
            theme={theme}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Icon 
            name="settings" 
            size="md" 
            color="muted"
            theme={theme}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    marginHorizontal: spacing[3],
    marginTop: spacing[1],
    marginBottom: spacing[2],
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  headerTitle: {
    ...typography.textStyles.bodySmall,
    fontWeight: '400',
    fontSize: 11,
    textAlign: 'left',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    ...typography.textStyles.caption,
    fontSize: 9,
    textAlign: 'left',
    fontWeight: '400',
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  headerButton: {
    padding: spacing[2],
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});