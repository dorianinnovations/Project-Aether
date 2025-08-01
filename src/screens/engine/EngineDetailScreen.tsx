/**
 * Engine Detail Screen - Individual Engine Analytics
 * Comprehensive analytics view for specific engine metrics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Text,
  StatusBar,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Design System
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { MetricCard, InsightChart } from '../../design-system/components/molecules';
import { designTokens, getThemeColors } from '../../design-system/tokens/colors';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { createNeumorphicContainer } from '../../design-system/tokens/shadows';
import { createStaggeredEntrance, getInitialAnimatedValues } from '../../design-system/animations/entrance';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';

// Services
import { AnalyticsAPI } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EngineDetailData {
  id: string;
  title: string;
  currentValue: string | number;
  subtitle: string;
  color: keyof typeof designTokens.semantic;
  trend: 'up' | 'down' | 'neutral';
  historicalData: Array<{ timestamp: string; value: number }>;
  insights: string[];
  subMetrics: Array<{
    name: string;
    value: string | number;
    change: string;
    color: string;
  }>;
}

const EngineDetailScreen: React.FC = () => {
  const { theme, colors } = useTheme();
  const themeColors = getThemeColors(theme);
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get engine ID from route params
  const { engineId, engineTitle } = route.params as { engineId: string; engineTitle: string };

  // State
  const [engineData, setEngineData] = useState<EngineDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation values
  const [animationValues] = useState(() => getInitialAnimatedValues(6));

  useEffect(() => {
    navigation.setOptions({
      title: engineTitle || 'Engine Analytics',
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        ...typography.textStyles.headlineMedium,
        fontWeight: '700',
      },
    });
  }, [navigation, engineTitle, colors, theme]);

  // Load detailed engine data
  const loadEngineDetail = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // Simulate loading detailed analytics data
      // In a real app, this would fetch from your API
      const mockDetailData: EngineDetailData = {
        id: engineId,
        title: engineTitle,
        currentValue: engineId === '1' ? 'Active' : engineId === '2' ? '87%' : '142',
        subtitle: 'Real-time analytics',
        color: engineId === '1' ? 'success' : engineId === '2' ? 'info' : 'warning',
        trend: 'up',
        historicalData: generateMockHistoricalData(),
        insights: [
          'Performance increased by 23% this week',
          'Peak activity detected during afternoon hours',
          'Optimization suggestions available',
          'Data quality remains consistently high',
        ],
        subMetrics: [
          { name: 'Accuracy', value: '94.2%', change: '+2.1%', color: designTokens.semantic.success },
          { name: 'Response Time', value: '120ms', change: '-15ms', color: designTokens.semantic.success },
          { name: 'Throughput', value: '450/min', change: '+12%', color: designTokens.semantic.info },
          { name: 'Error Rate', value: '0.3%', change: '-0.1%', color: designTokens.semantic.success },
        ],
      };

      setEngineData(mockDetailData);
      
      // Start staggered entrance animation
      createStaggeredEntrance(animationValues, {
        delay: 100,
        increment: 150,
      }).start();
      
    } catch (error) {
      console.error('Failed to load engine detail:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const generateMockHistoricalData = () => {
    const data = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      // Generate cleaner values - integers between 60-100
      const baseValue = 75 + (Math.sin(i * 0.3) * 20);
      const randomVariation = (Math.random() - 0.5) * 10;
      const value = Math.round(baseValue + randomVariation);
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.max(60, Math.min(100, value)), // Ensure readable range
      });
    }
    return data;
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadEngineDetail(false);
  };

  useEffect(() => {
    loadEngineDetail();
  }, [engineId]);

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  if (isLoading || !engineData) {
    return (
      <PageBackground theme={theme}>
        <SafeAreaView style={styles.container}>
          <StatusBar
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={colors.background}
          />
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
              Loading engine analytics...
            </Text>
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  return (
    <PageBackground theme={theme}>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
              colors={[colors.text]}
            />
          }
        >
          {/* Header Summary */}
          <Animated.View 
            style={[
              styles.headerCard,
              createNeumorphicContainer(theme, 'elevated'),
              { opacity: animationValues[0] }
            ]}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {engineData.title}
              </Text>
              <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
                {engineData.subtitle}
              </Text>
            </View>
            <View style={styles.headerValue}>
              <Text style={[
                styles.headerValueText, 
                { color: designTokens.semantic[engineData.color] }
              ]}>
                {engineData.currentValue}
              </Text>
              <Text style={[
                styles.trendIndicator,
                { color: engineData.trend === 'up' ? designTokens.semantic.success : designTokens.semantic.error }
              ]}>
                {engineData.trend === 'up' ? '↗' : '↘'}
              </Text>
            </View>
          </Animated.View>

          {/* Performance Chart */}
          <Animated.View style={{ opacity: animationValues[1] }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Performance Trends
            </Text>
            <View style={[styles.chartContainer, createNeumorphicContainer(theme, 'elevated')]}>
              <InsightChart
                title="Performance Chart"
                data={engineData.historicalData.map((d, index) => {
                  const hour = new Date(d.timestamp).getHours();
                  // Format hour labels more cleanly (every 4 hours)
                  const shouldShowLabel = index % 4 === 0;
                  return {
                    label: shouldShowLabel ? `${hour}h` : '',
                    value: d.value,
                    color: designTokens.semantic[engineData.color],
                  };
                })}
                type="line"
                theme={theme}
              />
            </View>
          </Animated.View>

          {/* Sub-Metrics Grid */}
          <Animated.View style={{ opacity: animationValues[2] }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Key Metrics
            </Text>
            <View style={styles.metricsGrid}>
              {engineData.subMetrics.map((metric, index) => (
                <Animated.View 
                  key={metric.name}
                  style={[
                    styles.subMetricCard,
                    createNeumorphicContainer(theme, 'elevated'),
                    { opacity: animationValues[3] }
                  ]}
                >
                  <Text style={[styles.subMetricName, { color: themeColors.textMuted }]}>
                    {metric.name}
                  </Text>
                  <Text style={[styles.subMetricValue, { color: colors.text }]}>
                    {metric.value}
                  </Text>
                  <Text style={[styles.subMetricChange, { color: metric.color }]}>
                    {metric.change}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Insights Section */}
          <Animated.View style={{ opacity: animationValues[4] }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Insights & Recommendations
            </Text>
            <View style={[styles.insightsContainer, createNeumorphicContainer(theme, 'elevated')]}>
              {engineData.insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={[styles.insightDot, { backgroundColor: designTokens.semantic[engineData.color] }]} />
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {insight}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    ...typography.textStyles.bodyLarge,
    fontWeight: '500',
  },

  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[5],
    marginVertical: spacing[4],
    borderRadius: 20,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    ...typography.textStyles.headlineMedium,
    fontWeight: '800',
    marginBottom: spacing[1],
  },

  headerSubtitle: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '500',
  },

  headerValue: {
    alignItems: 'flex-end',
  },

  headerValueText: {
    ...typography.textStyles.displaySmall,
    fontWeight: '900',
  },

  trendIndicator: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing[1],
  },

  sectionTitle: {
    ...typography.textStyles.headlineLarge,
    fontWeight: '700',
    marginBottom: spacing[3],
    marginTop: spacing[5],
  },

  chartContainer: {
    padding: spacing[4],
    borderRadius: 16,
    marginBottom: spacing[4],
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  subMetricCard: {
    width: (SCREEN_WIDTH - spacing[4] * 2 - spacing[3]) / 2,
    padding: spacing[4],
    borderRadius: 16,
    marginBottom: spacing[3],
    alignItems: 'center',
  },

  subMetricName: {
    ...typography.textStyles.labelMedium,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[2],
  },

  subMetricValue: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing[1],
  },

  subMetricChange: {
    ...typography.textStyles.labelSmall,
    fontWeight: '700',
    textAlign: 'center',
  },

  insightsContainer: {
    padding: spacing[4],
    borderRadius: 16,
    marginBottom: spacing[4],
  },

  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },

  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: spacing[2],
    marginRight: spacing[3],
  },

  insightText: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },

  bottomSpacing: {
    height: spacing[8],
  },
});

export default EngineDetailScreen;