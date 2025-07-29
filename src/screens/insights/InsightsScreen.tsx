/**
 * Numina - Personal Insights Dashboard
 * Numina-powered behavioral analysis and growth tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Components
import MetricCard from '../../design-system/components/molecules/MetricCard';
import InsightChart from '../../design-system/components/molecules/InsightChart';
import { Header, HeaderMenu, SignOutModal } from '../../design-system/components/organisms';

// Design System
import { designTokens, getThemeColors } from '../../design-system/tokens/colors';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { createNeumorphicContainer } from '../../design-system/tokens/shadows';
import { createStaggeredEntrance, getInitialAnimatedValues } from '../../design-system/animations/entrance';
import { useHeaderMenu } from '../../design-system/hooks';

// Services
import { AnalyticsAPI, ApiUtils, AuthAPI } from '../../services/api';

interface InsightData {
  id: string;
  category: 'growth' | 'emotional' | 'behavioral' | 'social';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
}

interface MetricData {
  id: string;
  name: string;
  value: number | string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: keyof typeof designTokens.semantic;
  subtitle?: string;
}

interface ChartData {
  id: string;
  title: string;
  subtitle: string;
  type: 'bar' | 'line' | 'progress';
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
}

interface InsightsScreenProps {
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

const InsightsScreen: React.FC<InsightsScreenProps> = ({
  theme = 'light',
  onThemeToggle,
}) => {
  // State
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Navigation
  const navigation = useNavigation();
  
  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'insights',
    onSignOut: () => setShowSignOutModal(true)
  });
  
  // Animation values
  const [animationValues] = useState(() => getInitialAnimatedValues(6));

  const themeColors = getThemeColors(theme);

  // Load insights data
  const loadInsights = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // Try to make parallel API calls for better performance
      let growthSummary, emotionalReport, ubpmContext;
      
      try {
        [growthSummary, emotionalReport, ubpmContext] = await Promise.all([
          AnalyticsAPI.getPersonalInsights(),
          AnalyticsAPI.getEmotionalAnalytics(),
          AnalyticsAPI.getUBPMContext(),
        ]);
      } catch (apiError) {
        console.log('API endpoints not available, using demo data');
        // Continue with demo data
      }

      // Process API data into component format
      // Using demo data for MVP demonstration
      const mockMetrics: MetricData[] = [
        {
          id: '1',
          name: 'Growth Score',
          value: '8.7',
          trend: 'up',
          trendValue: '+12%',
          color: 'success',
          subtitle: 'Personal development trajectory',
        },
        {
          id: '2', 
          name: 'Emotional Balance',
          value: '92%',
          trend: 'up',
          trendValue: '+5%',
          color: 'info',
          subtitle: 'Weekly emotional stability',
        },
        {
          id: '3',
          name: 'Social Connections',
          value: '24',
          trend: 'neutral',
          trendValue: '±0',
          color: 'love',
          subtitle: 'Active meaningful relationships',
        },
        {
          id: '4',
          name: 'Behavioral Patterns',
          value: '156',
          trend: 'up',
          trendValue: '+8',
          color: 'wisdom',
          subtitle: 'Tracked behavioral insights',
        },
      ];

      const mockCharts: ChartData[] = [
        {
          id: 'emotional-trends',
          title: 'Emotional Trends',
          subtitle: 'Last 7 days emotional patterns',
          type: 'line',
          data: [
            { label: 'Mon', value: 75 },
            { label: 'Tue', value: 82 },
            { label: 'Wed', value: 78 },
            { label: 'Thu', value: 88 },
            { label: 'Fri', value: 92 },
            { label: 'Sat', value: 85 },
            { label: 'Sun', value: 90 },
          ],
        },
        {
          id: 'growth-areas',
          title: 'Growth Areas',
          subtitle: 'Personal development focus',
          type: 'progress',
          data: [
            { label: 'Communication', value: 85, color: designTokens.semantic.success },
            { label: 'Creativity', value: 72, color: designTokens.semantic.warning },
            { label: 'Leadership', value: 68, color: designTokens.semantic.info },
            { label: 'Mindfulness', value: 91, color: designTokens.semantic.wisdom },
          ],
        },
        {
          id: 'weekly-activity',
          title: 'Weekly Activity',
          subtitle: 'Engagement patterns',
          type: 'bar',
          data: [
            { label: 'Chat', value: 45, color: designTokens.brand.primary },
            { label: 'Insights', value: 28, color: designTokens.semantic.info },
            { label: 'Connect', value: 32, color: designTokens.semantic.love },
            { label: 'Reflect', value: 38, color: designTokens.semantic.wisdom },
          ],
        },
      ];

      const mockInsights: InsightData[] = [
        {
          id: '1',
          category: 'behavioral',
          title: 'Communication Pattern Shift',
          description: 'You\'ve shown 23% more assertive communication this week, particularly in problem-solving conversations.',
          confidence: 0.87,
          timestamp: '2 hours ago',
        },
        {
          id: '2',
          category: 'growth',
          title: 'Learning Acceleration',
          description: 'Your curiosity-driven questions have increased 40%. This suggests an active growth mindset phase.',
          confidence: 0.92,
          timestamp: '5 hours ago',
        },
        {
          id: '3',
          category: 'emotional',
          title: 'Emotional Resilience',
          description: 'Response patterns indicate improved emotional regulation during challenging topics.',
          confidence: 0.78,
          timestamp: '1 day ago',
        },
      ];

      setMetrics(mockMetrics);
      setCharts(mockCharts);
      setInsights(mockInsights);

      // Trigger entrance animations
      if (showLoading) {
        createStaggeredEntrance(animationValues, {
          delay: 300,
          increment: 150,
          duration: 500,
        }).start();
      }

    } catch (error: any) {
      console.error('Failed to load insights:', error);
      Alert.alert(
        'Error Loading Insights',
        ApiUtils.getErrorMessage(error),
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadInsights();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadInsights(false);
  };

  // Handle metric card press
  const handleMetricPress = (metric: MetricData) => {
    Alert.alert(
      metric.name,
      `Current Value: ${metric.value}\nTrend: ${metric.trendValue}\n\n${metric.subtitle}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // Render insight card
  const renderInsightCard = (insight: InsightData) => {
    const categoryColors = {
      growth: designTokens.semantic.success,
      emotional: designTokens.semantic.info,
      behavioral: designTokens.semantic.wisdom,
      social: designTokens.semantic.love,
    };

    return (
      <View 
        key={insight.id}
        style={[styles.insightCard, createNeumorphicContainer(theme, 'elevated')]}
      >
        <View style={styles.insightHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: `${categoryColors[insight.category]}15` }]}>
            <Text style={[styles.categoryText, { color: categoryColors[insight.category] }]}>
              {insight.category.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.insightTimestamp, { color: themeColors.textMuted }]}>
            {insight.timestamp}
          </Text>
        </View>
        
        <Text style={[styles.insightTitle, { color: themeColors.text }]}>
          {insight.title}
        </Text>
        
        <Text style={[styles.insightDescription, { color: themeColors.textSecondary }]}>
          {insight.description}
        </Text>
        
        <View style={styles.insightFooter}>
          <View style={styles.confidenceBar}>
            <View style={[styles.confidenceTrack, { backgroundColor: themeColors.surfaces.sunken }]}>
              <View 
                style={[
                  styles.confidenceFill,
                  { 
                    width: `${insight.confidence * 100}%`,
                    backgroundColor: categoryColors[insight.category],
                  }
                ]} 
              />
            </View>
            <Text style={[styles.confidenceText, { color: themeColors.textMuted }]}>
              {Math.round(insight.confidence * 100)}% confidence
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Header menu action handler now provided by useHeaderMenu hook

  // Render header
  const renderHeader = () => (
    <Header
      title="Personal Insights"
      subtitle="Numina-powered behavioral analysis and growth tracking"
      
      showMenuButton={true}
      showBackButton={false}
      onMenuPress={toggleHeaderMenu}
      isVisible={true}
      isActive={isLoading}
      isMenuOpen={showHeaderMenu}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar 
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Header Menu */}
      <HeaderMenu
        visible={showHeaderMenu}
        onClose={() => {
          if (setShowHeaderMenu) {
            setShowHeaderMenu(false);
          }
        }}
        onAction={handleMenuAction}
        showAuthOptions={false}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={designTokens.brand.primary}
            colors={[designTokens.brand.primary]}
          />
        }
      >
        {renderHeader()}

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <View key={metric.id} style={styles.metricItem}>
              <MetricCard
                title={metric.name}
                value={metric.value}
                subtitle={metric.subtitle}
                trend={metric.trend}
                trendValue={metric.trendValue}
                color={metric.color}
                
                onPress={() => handleMetricPress(metric)}
              />
            </View>
          ))}
        </View>

        {/* Charts */}
        {charts.map((chart) => (
          <InsightChart
            key={chart.id}
            title={chart.title}
            subtitle={chart.subtitle}
            data={chart.data}
            type={chart.type}
            
          />
        ))}

        {/* Numina Insights */}
        <View style={styles.insightsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Numina Insights
          </Text>
          <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
            Personalized insights from your behavioral patterns
          </Text>
          
          {insights.map(renderInsightCard)}
        </View>
      </ScrollView>
      
      {/* Sign Out Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={async () => {
          try {
            await AuthAPI.logout();
            // Auth check in App.tsx will handle navigation automatically
          } catch (error) {
            console.error('Sign out error:', error);
          }
        }}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[6],
  },

  // Header
  header: {
    margin: spacing[4],
    padding: spacing[4],
    borderRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.textStyles.headlineMedium,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    ...typography.textStyles.body,
    textAlign: 'center',
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[2],
  },
  metricItem: {
    width: '50%',
    paddingHorizontal: spacing[2],
  },

  // Sections
  insightsSection: {
    margin: spacing[4],
  },
  sectionTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  sectionSubtitle: {
    ...typography.textStyles.body,
    marginBottom: spacing[4],
  },

  // Insight Cards
  insightCard: {
    padding: spacing[4],
    borderRadius: 16,
    marginBottom: spacing[3],
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  categoryBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },
  categoryText: {
    ...typography.textStyles.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  insightTimestamp: {
    ...typography.textStyles.caption,
  },
  insightTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  insightDescription: {
    ...typography.textStyles.body,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  insightFooter: {
    marginTop: 'auto',
  },
  confidenceBar: {
    gap: spacing[2],
  },
  confidenceTrack: {
    height: 4,
    borderRadius: 2,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    ...typography.textStyles.caption,
    textAlign: 'right',
  },
});

export default InsightsScreen;