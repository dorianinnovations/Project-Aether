/**
 * Aether - EngineCard Component
 * Short wide cards for Engine analytics with drawer-style animations
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Design System
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { createNeumorphicContainer } from '../../tokens/shadows';
import TrendChart from './TrendChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TrendDataPoint {
  hour: number;
  value: number;
  majorDetail: string;
}

interface EngineCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  color?: keyof typeof designTokens.semantic;
  trend?: 'up' | 'down' | 'neutral';
  live?: boolean;
  theme?: 'light' | 'dark';
  onPress?: () => void;
  showChart?: boolean;
  chartData?: TrendDataPoint[];
}

const EngineCard: React.FC<EngineCardProps> = ({
  id,
  title,
  value,
  subtitle,
  color = 'info',
  trend,
  live = false,
  theme = 'light',
  onPress,
  showChart = false,
  chartData = [],
}) => {
  const themeColors = getThemeColors(theme);
  const engineColor = designTokens.semantic[color];
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Drawer-style animation - slide and scale
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 100,
      }),
      Animated.spring(slideAnim, {
        toValue: 8,
        useNativeDriver: true,
        tension: 120,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
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

  const content = (
    <Animated.View 
      style={[
        styles.card,
        showChart && styles.cardWithChart,
        createNeumorphicContainer(theme, 'elevated'),
        { 
          transform: [
            { scale: scaleAnim },
            { translateX: slideAnim }
          ],
          opacity: opacityAnim,
        }
      ]}
    >
      {/* Top section - Header and content */}
      <View style={styles.topSection}>
        {/* Left section - Main content */}
        <View style={styles.leftSection}>
          {/* Live indicator moved above title and aligned left */}
          {live ? (
            <View style={styles.liveIndicator}>
              <View style={[styles.liveDot, { backgroundColor: designTokens.semantic.success }]} />
              <Text style={[styles.liveText, { color: designTokens.semantic.success }]}>
                LIVE
              </Text>
            </View>
          ) : (
            <View style={styles.liveIndicator}>
              <View style={[styles.liveDot, { backgroundColor: themeColors.textMuted }]} />
              <Text style={[styles.liveText, { color: themeColors.textMuted }]}>
                NONE
              </Text>
            </View>
          )}

          <Text style={[styles.cardTitle, { color: themeColors.textSecondary }]}>
            {title}
          </Text>

          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            {subtitle}
          </Text>
        </View>

        {/* Right section - Value and trend */}
        <View style={styles.rightSection}>
          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: engineColor }]}>
              {value}
            </Text>
            {trend && (
              <Text style={[styles.trendIndicator, { color: getTrendColor() }]}>
                {getTrendIcon()}
              </Text>
            )}
          </View>

          {/* Status indicator */}
          <View style={[styles.statusBar, { backgroundColor: `${engineColor}20` }]}>
            <View style={[styles.statusFill, { 
              backgroundColor: engineColor,
              width: '75%'
            }]} />
          </View>
        </View>

        {/* Expand indicator */}
        <View style={styles.expandIndicator}>
          <Text style={[styles.expandArrow, { color: themeColors.textMuted }]}>
            ›››
          </Text>
        </View>
      </View>

      {/* Chart section - Only shown for thinking style */}
      {showChart && chartData.length > 0 && (
        <View style={styles.chartSection}>
          <TrendChart
            data={chartData}
            theme={theme}
            color={color}
            height={140}
            showPoints={false}
            title=""
          />
        </View>
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  touchable: {
    marginVertical: spacing[1],
    alignSelf: 'center',
  },
  
  card: {
    width: SCREEN_WIDTH - (spacing[4] * 2),
    height: 88,
    borderRadius: 16,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    flexDirection: 'column',
  },

  cardWithChart: {
    height: 400,
  },

  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },

  leftSection: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },

  cardTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: spacing[1],
  },

  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
    alignSelf: 'flex-start',
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing[1],
  },

  liveText: {
    ...typography.textStyles.labelSmall,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },

  subtitle: {
    ...typography.textStyles.bodySmall,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },

  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 100,
    height: '100%',
  },

  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
    height: 24,
  },

  value: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '800',
    textAlign: 'right',
    lineHeight: 24,
  },

  trendIndicator: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: spacing[1],
  },

  statusBar: {
    width: 60,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },

  statusFill: {
    height: '100%',
    borderRadius: 2,
  },

  expandIndicator: {
    marginLeft: spacing[2],
    opacity: 0.6,
    alignSelf: 'center',
  },

  expandArrow: {
    ...typography.textStyles.labelMedium,
    fontWeight: '300',
    letterSpacing: -1,
  },

  chartSection: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
});

export default EngineCard;