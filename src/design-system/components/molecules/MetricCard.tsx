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

  const content = (
    <Animated.View 
      style={[
        cardStyles,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.textSecondary }]}>
          {title}
        </Text>
        {trend && trendValue && (
          <View style={[styles.trend, { backgroundColor: `${getTrendColor()}15` }]}>
            <Text style={[styles.trendIcon, { color: getTrendColor() }]}>
              {getTrendIcon()}
            </Text>
            <Text style={[styles.trendValue, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>

      {/* Value */}
      <Text style={[
        styles.value,
        { color: metricColor },
        variant === 'featured' && styles.valueFeatured,
        variant === 'compact' && styles.valueCompact,
      ]}>
        {value}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          {subtitle}
        </Text>
      )}

      {/* Accent line */}
      <View style={[styles.accentLine, { backgroundColor: metricColor }]} />
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
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },

  title: {
    ...typography.textStyles.caption,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },

  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },
  trendIcon: {
    ...typography.textStyles.caption,
    marginRight: spacing[1],
  },
  trendValue: {
    ...typography.textStyles.caption,
    fontWeight: '600',
  },

  value: {
    ...typography.textStyles.displaySmall,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  valueFeatured: {
    ...typography.textStyles.displayMedium,
  },
  valueCompact: {
    ...typography.textStyles.headlineMedium,
  },

  subtitle: {
    ...typography.textStyles.bodyLarge,
    marginBottom: spacing[2],
  },

  accentLine: {
    height: 3,
    borderRadius: 2,
    width: '30%',
  },
});

export default MetricCard;