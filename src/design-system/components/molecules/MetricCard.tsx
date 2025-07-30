/**
 * Aether - MetricCard Component
 * Beautiful neumorphic cards for displaying user metrics and insights
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Design System
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { createNeumorphicContainer } from '../../tokens/shadows';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: keyof typeof designTokens.semantic;
  variant?: 'default' | 'compact' | 'featured';
  theme?: 'light' | 'dark';
  onPress?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'info',
  variant = 'default',
  theme = 'light',
  onPress,
}) => {
  const themeColors = getThemeColors(theme);
  const metricColor = designTokens.semantic[color];
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return designTokens.semantic.success;
      case 'down': return designTokens.semantic.error;
      default: return themeColors.textMuted;
    }
  };

  const cardStyles = [
    styles.card,
    createNeumorphicContainer(theme, 'elevated'),
    variant === 'compact' && styles.cardCompact,
    variant === 'featured' && styles.cardFeatured,
  ];

  // Convert titles to moderately techy format
  const getTechTitle = (title: string) => {
    const techMap: Record<string, string> = {
      'Profile Confidence': 'Confidence',
      'Behavior Patterns': 'Patterns',
      'Communication': 'Comm Style',
      'Emotional Patterns': 'Emotions',
      'Personality Traits': 'Traits',
      'Data Quality': 'Data Quality',
    };
    return techMap[title] || title;
  };

  const content = (
    <Animated.View 
      style={[
        cardStyles,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.cardTitle, { color: themeColors.textSecondary }]}>
          {getTechTitle(title)}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: metricColor }]} />
      </View>

      {/* Main Value Display */}
      <View style={styles.valueContainer}>
        <Text style={[
          styles.value,
          { color: metricColor },
          variant === 'featured' && styles.valueFeatured,
          variant === 'compact' && styles.valueCompact,
        ]}>
          {value}
        </Text>
        {trend && (
          <Text style={[styles.trendIndicator, { color: getTrendColor() }]}>
            {getTrendIcon()}
          </Text>
        )}
      </View>

      {/* Trend Info */}
      {trendValue && (
        <View style={styles.trendContainer}>
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {getTrendIcon()} {trendValue}
          </Text>
        </View>
      )}

      {/* Progress indicator */}
      <View style={[styles.progressBar, { backgroundColor: `${metricColor}20` }]}>
        <View style={[styles.progressFill, { 
          backgroundColor: metricColor,
          width: typeof value === 'string' && value.includes('%') ? value as any : '70%'
        }]} />
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    padding: spacing[4],
    borderRadius: 20,
    marginVertical: spacing[2],
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardCompact: {
    padding: spacing[3],
    minHeight: 80,
  },
  cardFeatured: {
    padding: spacing[5],
    minHeight: 140,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },

  cardTitle: {
    ...typography.textStyles.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0,
    flex: 1,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing[2],
  },

  value: {
    ...typography.textStyles.displaySmall,
    fontWeight: '700',
    flex: 1,
  },
  valueFeatured: {
    ...typography.textStyles.displayMedium,
  },
  valueCompact: {
    ...typography.textStyles.headlineMedium,
  },

  trendIndicator: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing[1],
  },

  trendContainer: {
    marginBottom: spacing[2],
  },

  trendText: {
    ...typography.textStyles.caption,
    fontWeight: '600',
  },

  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default MetricCard;