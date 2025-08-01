/**
 * ConversationSkeleton - Skeleton loader for conversation list items
 * Matches the exact layout of conversation cards while loading
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../../contexts/ThemeContext';
import { designTokens } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

const ConversationSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const shimmerValue = useSharedValue(0);

  React.useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerValue.value,
      [0, 1],
      [0.4, 0.8]
    );
    
    return {
      opacity,
    };
  });

  const getSkeletonColor = () => {
    return theme === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.08)';
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme === 'dark'
          ? 'rgba(45, 45, 45, 0.4)'
          : 'rgba(248, 250, 252, 0.3)',
      }
    ]}>
      <View style={styles.content}>
        {/* Title and Time Row */}
        <View style={styles.header}>
          <Animated.View style={[
            styles.titleSkeleton,
            { backgroundColor: getSkeletonColor() },
            shimmerStyle,
          ]} />
          <Animated.View style={[
            styles.timeSkeleton,
            { backgroundColor: getSkeletonColor() },
            shimmerStyle,
          ]} />
        </View>
        
        {/* Summary/Preview */}
        <Animated.View style={[
          styles.summarySkeleton,
          { backgroundColor: getSkeletonColor() },
          shimmerStyle,
        ]} />
        <Animated.View style={[
          styles.summarySkeletonShort,
          { backgroundColor: getSkeletonColor() },
          shimmerStyle,
        ]} />
        
        {/* Meta Row */}
        <View style={styles.meta}>
          <Animated.View style={[
            styles.messageCountSkeleton,
            { backgroundColor: getSkeletonColor() },
            shimmerStyle,
          ]} />
          <Animated.View style={[
            styles.dotsSkeleton,
            { backgroundColor: getSkeletonColor() },
            shimmerStyle,
          ]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: 12,
  },
  content: {
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSkeleton: {
    height: 20,
    width: '60%',
    borderRadius: 4,
  },
  timeSkeleton: {
    height: 14,
    width: '20%',
    borderRadius: 3,
  },
  summarySkeleton: {
    height: 16,
    width: '90%',
    borderRadius: 3,
  },
  summarySkeletonShort: {
    height: 16,
    width: '65%',
    borderRadius: 3,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCountSkeleton: {
    height: 12,
    width: '30%',
    borderRadius: 3,
  },
  dotsSkeleton: {
    height: 16,
    width: 16,
    borderRadius: 8,
  },
});

export default ConversationSkeleton;