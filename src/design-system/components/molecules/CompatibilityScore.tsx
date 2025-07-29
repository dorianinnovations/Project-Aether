/**
 * Aether - CompatibilityScore Component
 * Animated compatibility visualization with detailed breakdown
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

// Design System
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { createNeumorphicContainer } from '../../tokens/shadows';

interface CompatibilityBreakdown {
  category: string;
  score: number;
  color: string;
  description?: string;
}

interface CompatibilityScoreProps {
  overallScore: number;
  breakdown: CompatibilityBreakdown[];
  variant?: 'compact' | 'detailed';
  theme?: 'light' | 'dark';
  animated?: boolean;
}

const CompatibilityScore: React.FC<CompatibilityScoreProps> = ({
  overallScore,
  breakdown,
  variant = 'detailed',
  theme = 'light',
  animated = true,
}) => {
  const themeColors = getThemeColors(theme);
  const scoreAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnims = React.useRef(
    breakdown.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (animated) {
      // Animate overall score
      Animated.timing(scoreAnim, {
        toValue: overallScore,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      // Animate progress bars with stagger
      const animations = progressAnims.map((anim, index) =>
        Animated.timing(anim, {
          toValue: breakdown[index].score,
          duration: 1500,
          delay: index * 200,
          useNativeDriver: false,
        })
      );

      Animated.stagger(100, animations).start();
    } else {
      scoreAnim.setValue(overallScore);
      progressAnims.forEach((anim, index) => {
        anim.setValue(breakdown[index].score);
      });
    }
  }, [overallScore, breakdown, animated]);

  const getScoreColor = () => {
    if (overallScore >= 90) return designTokens.semantic.success;
    if (overallScore >= 75) return designTokens.semantic.warning;
    if (overallScore >= 60) return designTokens.semantic.info;
    return designTokens.semantic.error;
  };

  const getScoreLabel = () => {
    if (overallScore >= 90) return 'Exceptional Match';
    if (overallScore >= 75) return 'Great Match';
    if (overallScore >= 60) return 'Good Match';
    return 'Potential Match';
  };

  const renderCompactView = () => (
    <View style={[styles.compactContainer, createNeumorphicContainer(theme, 'elevated')]}>
      <View style={styles.compactScore}>
        <Animated.Text style={[
          styles.compactScoreText,
          { color: getScoreColor() }
        ]}>
          {animated ? (
            scoreAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0', '100'],
              extrapolate: 'clamp',
            }) as any
          ) : overallScore}%
        </Animated.Text>
        <Text style={[styles.compactLabel, { color: themeColors.textMuted }]}>
          Compatibility
        </Text>
      </View>
      
      <View style={styles.compactBreakdown}>
        {breakdown.slice(0, 3).map((item, index) => (
          <View key={index} style={styles.compactCategory}>
            <View style={[styles.compactDot, { backgroundColor: item.color }]} />
            <Text style={[styles.compactCategoryText, { color: themeColors.textSecondary }]}>
              {item.category}: {item.score}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDetailedView = () => (
    <View style={[styles.detailedContainer, createNeumorphicContainer(theme, 'elevated')]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Compatibility Analysis
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Aether-powered relationship matching
        </Text>
      </View>

      {/* Overall Score */}
      <View style={styles.overallScore}>
        <View style={[
          styles.scoreCircle,
          { borderColor: getScoreColor() }
        ]}>
          <Animated.Text style={[
            styles.scoreText,
            { color: getScoreColor() }
          ]}>
            {animated ? (
              scoreAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0', '100'],
                extrapolate: 'clamp',
              }) as any
            ) : overallScore}%
          </Animated.Text>
        </View>
        
        <Text style={[styles.scoreLabel, { color: getScoreColor() }]}>
          {getScoreLabel()}
        </Text>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdown}>
        <Text style={[styles.breakdownTitle, { color: themeColors.text }]}>
          Compatibility Breakdown
        </Text>
        
        {breakdown.map((item, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryName, { color: themeColors.text }]}>
                {item.category}
              </Text>
              <Animated.Text style={[styles.categoryScore, { color: item.color }]}>
                {animated ? (
                  progressAnims[index].interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0', '100'],
                    extrapolate: 'clamp',
                  }) as any
                ) : item.score}%
              </Animated.Text>
            </View>
            
            <View style={[styles.progressTrack, { backgroundColor: themeColors.surfaces.sunken }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: item.color,
                    width: animated ? progressAnims[index].interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }) : `${item.score}%`,
                  }
                ]}
              />
            </View>
            
            {item.description && (
              <Text style={[styles.categoryDescription, { color: themeColors.textMuted }]}>
                {item.description}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return variant === 'compact' ? renderCompactView() : renderDetailedView();
};

const styles = StyleSheet.create({
  // Compact View
  compactContainer: {
    padding: spacing[3],
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactScore: {
    alignItems: 'center',
  },
  compactScoreText: {
    ...typography.textStyles.headlineMedium,
    fontWeight: '700',
  },
  compactLabel: {
    ...typography.textStyles.caption,
    marginTop: spacing[1],
  },
  compactBreakdown: {
    flex: 1,
    marginLeft: spacing[4],
    gap: spacing[1],
  },
  compactCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  compactCategoryText: {
    ...typography.textStyles.caption,
  },

  // Detailed View
  detailedContainer: {
    padding: spacing[4],
    borderRadius: 20,
    margin: spacing[4],
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.textStyles.body,
    textAlign: 'center',
  },

  overallScore: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  scoreText: {
    ...typography.textStyles.displaySmall,
    fontWeight: '700',
  },
  scoreLabel: {
    ...typography.textStyles.body,
    fontWeight: '600',
  },

  breakdown: {
    gap: spacing[3],
  },
  breakdownTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    marginBottom: spacing[2],
  },

  categoryItem: {
    gap: spacing[2],
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    ...typography.textStyles.body,
    fontWeight: '500',
  },
  categoryScore: {
    ...typography.textStyles.body,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryDescription: {
    ...typography.textStyles.caption,
    lineHeight: 16,
  },
});

export default CompatibilityScore;