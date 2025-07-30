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
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Components
import MetricCard from '../../design-system/components/molecules/MetricCard';
import InsightChart from '../../design-system/components/molecules/InsightChart';
import { Header, HeaderMenu, SignOutModal, MetricDetailModal } from '../../design-system/components/organisms';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import LottieLoader from '../../design-system/components/atoms/LottieLoader';
import SettingsModal from '../chat/SettingsModal';

// Design System
import { designTokens, getThemeColors } from '../../design-system/tokens/colors';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { createNeumorphicContainer } from '../../design-system/tokens/shadows';
import { getGlassmorphicStyle } from '../../design-system/tokens/glassmorphism';
import { createStaggeredEntrance, getInitialAnimatedValues } from '../../design-system/animations/entrance';
import { useHeaderMenu } from '../../design-system/hooks';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';

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
  title?: string;
  description?: string;
  details?: string;
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

interface InsightsScreenProps {}

const InsightsScreen: React.FC<InsightsScreenProps> = () => {
  const { theme, colors } = useTheme();
  // State
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);

  // Navigation
  const navigation = useNavigation();
  
  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'insights',
    onSettingsPress: () => setShowSettings(true),
    onSignOut: () => setShowSignOutModal(true)
  });
  
  // Animation values
  const [animationValues] = useState(() => getInitialAnimatedValues(6));

  // Use colors from theme context instead of getThemeColors
  const themeColors = colors;

  // Load insights data
  const loadInsights = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // Try to make parallel API calls for better performance
      let ubpmContext, collectiveSnapshot;
      
      try {
        ubpmContext = await AnalyticsAPI.getUBPMContext(); // ONLY individual user behavioral patterns
      } catch (apiError) {
        // API endpoints not available, continue with empty state
      }

      // Process REAL individual user behavioral data from MongoDB
      let processedMetrics: MetricData[] = [];
      let processedCharts: ChartData[] = [];
      
      if (ubpmContext?.success && ubpmContext.data) {
        const ubpmData = ubpmContext.data;
        
        // Check if user has real behavioral data or is still building profile
        if (ubpmData.status === 'building_profile') {
          // New user - show empty state
          processedMetrics = [];
          processedCharts = [];
        } else {
          // User has real behavioral patterns
          const behavioralPatterns = ubpmData.behavioralContext?.detectedPatterns || [];
          const emotionalPatterns = ubpmData.emotionalContext?.emotionalPatterns || [];
          const personalityTraits = ubpmData.personalityTraits || [];
          
          
          // Build comprehensive metrics from real UBPM data
          const metricsArray: MetricData[] = [];
          
          // Profile confidence - from ubpmData.confidence
          metricsArray.push({
            id: '1',
            name: 'Profile Confidence',
            value: `${Math.round((ubpmData.confidence || 0) * 100)}%`,
            trend: ubpmData.confidence > 0.5 ? 'up' : 'neutral',
            trendValue: `${ubpmData.dataPoints || 0} data points`,
            color: 'success',
            subtitle: 'How well Numina understands your personality',
          });
          
          // Total behavioral patterns detected
          metricsArray.push({
            id: '2', 
            name: 'Behavior Patterns',
            value: behavioralPatterns.length.toString(),
            trend: behavioralPatterns.length > 0 ? 'up' : 'neutral',
            trendValue: behavioralPatterns.length > 0 ? 'detected' : 'none yet',
            color: 'info',
            subtitle: 'How you interact and communicate',
          });
          
          // Communication style analysis
          const commStyle = ubpmData.behavioralContext?.communicationStyle || 'analyzing';
          const commStyleReadable = commStyle.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          metricsArray.push({
            id: '3',
            name: 'Communication Style',
            value: commStyleReadable,
            trend: 'neutral',
            trendValue: `${Math.round((ubpmData.behavioralContext?.confidence || 0) * 100)}% confidence`,
            color: 'love',
            subtitle: 'Your unique way of expressing ideas',
          });
          
          // Raw emotion count (emotions analyzed from conversations)
          const rawEmotionCount = ubpmData.emotionalContext?.rawEmotionCount || 0;
          metricsArray.push({
            id: '4',
            name: 'Emotions Tracked',
            value: rawEmotionCount.toString(),
            trend: rawEmotionCount > 0 ? 'up' : 'neutral',
            trendValue: rawEmotionCount > 0 ? 'from chats' : 'start chatting',
            color: 'wisdom',
            subtitle: 'Emotional states captured while you chat',
          });
          
          // Personality traits analyzed
          metricsArray.push({
            id: '5',
            name: 'Personality Traits',
            value: personalityTraits.length.toString(),
            trend: personalityTraits.length > 0 ? 'up' : 'neutral',
            trendValue: personalityTraits.length > 0 ? 'identified' : 'analyzing',
            color: 'warning',
            subtitle: 'Core aspects of who you are',
          });
          
          // Emotional pattern analysis (UBPM patterns)
          metricsArray.push({
            id: '6',
            name: 'Emotional Patterns',
            value: emotionalPatterns.length.toString(),
            trend: emotionalPatterns.length > 0 ? 'up' : 'neutral',
            trendValue: emotionalPatterns.length > 0 ? 'patterns found' : 'need more data',
            color: 'love',
            subtitle: 'How your emotions change over time',
          });

          // Data quality score
          metricsArray.push({
            id: '7',
            name: 'Profile Completeness',
            value: `${Math.round((ubpmData.dataQuality?.completeness || 0) * 100)}%`,
            trend: (ubpmData.dataQuality?.completeness || 0) > 0.7 ? 'up' : 'neutral',
            trendValue: ubpmData.dataQuality?.freshness ? `${Math.round(ubpmData.dataQuality.freshness * 100)}% fresh` : 'keep chatting',
            color: 'info',
            subtitle: 'How complete your behavioral profile is',
          });
          
          processedMetrics = metricsArray;

          // Create behavioral patterns chart
          if (behavioralPatterns.length > 0) {
            const behaviorChart: ChartData = {
              id: 'behavioral-patterns',
              title: 'Your Behavioral Patterns',
              subtitle: `${behavioralPatterns.length} patterns detected with ${Math.round((ubpmData.confidence || 0) * 100)}% confidence`,
              type: 'bar',
              data: behavioralPatterns.map((pattern: string, index: number) => ({
                label: pattern.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: Math.round((ubpmData.confidence || 0) * 100),
                color: [
                  designTokens.semantic.success,
                  designTokens.semantic.info,
                  designTokens.semantic.warning,
                  designTokens.semantic.love,
                  designTokens.semantic.wisdom
                ][index % 5],
              })),
            };
            processedCharts.push(behaviorChart);
          }

          // Create personality traits chart if available
          if (personalityTraits.length > 0) {
            const personalityChart: ChartData = {
              id: 'personality-traits',
              title: 'Personality Traits',
              subtitle: `${personalityTraits.length} traits analyzed`,
              type: 'progress',
              data: personalityTraits.slice(0, 5).map((trait: any, index: number) => ({
                label: trait.trait.charAt(0).toUpperCase() + trait.trait.slice(1),
                value: Math.round((trait.score || 0) * 100),
                color: [
                  designTokens.semantic.success,
                  designTokens.semantic.info,
                  designTokens.semantic.warning,
                  designTokens.semantic.love,
                  designTokens.semantic.wisdom
                ][index % 5],
              })),
            };
            processedCharts.push(personalityChart);
          }
        }
      }

      // Show empty state for new users instead of fake data
      const finalMetrics = processedMetrics.length > 0 ? processedMetrics : [];

      // Use processed charts from real emotional data
      const finalCharts = processedCharts.length > 0 ? processedCharts : [];

      setMetrics(finalMetrics);
      setCharts(finalCharts);
      setInsights([]);

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
      if (showLoading) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadInsights();
  }, []);

  // Real-time polling for UBPM updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadInsights(false); // Refresh without loading state
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Execute API call and minimum duration in parallel for smooth UX
    await Promise.all([
      loadInsights(false),
      new Promise(resolve => setTimeout(resolve, 1200)) // Minimum 1.2 seconds
    ]);
  };

  // Handle metric card press
  const handleMetricPress = (metric: MetricData) => {
    const getDetailedExplanation = (metricName: string) => {
      const explanations: Record<string, { title: string; description: string; details: string }> = {
        'Profile Confidence': {
          title: 'How Well Numina Knows You',
          description: 'This shows how confident Numina is about understanding your personality and behavior.',
          details: 'The more you chat, the higher this gets! A higher score means Numina can give you more personalized and accurate responses. It looks at how you communicate, your interests, and how consistent your behavior is.'
        },
        'Behavior Patterns': {
          title: 'Your Interaction Style',
          description: 'The different ways you communicate and behave that make you unique.',
          details: 'Numina notices patterns like whether you ask lots of questions, prefer detailed explanations, or like to get straight to the point. These patterns help it talk to you in the way you prefer.'
        },
        'Communication Style': {
          title: 'How You Like to Talk',
          description: 'Your unique way of expressing yourself and communicating with others.',
          details: 'Are you formal or casual? Do you like detailed explanations or quick answers? Numina learns your style so it can talk to you in a way that feels natural and comfortable.'
        },
        'Emotions Tracked': {
          title: 'Your Emotional Journey',
          description: 'The different emotions Numina has detected while you chat.',
          details: 'Every time you chat, Numina notices if you seem excited, curious, frustrated, or any other emotion. Tracking these helps it respond with the right tone and level of support.'
        },
        'Emotional Patterns': {
          title: 'How Your Emotions Change',
          description: 'Patterns in how your emotions shift and develop over time.',
          details: 'After collecting enough emotional data, Numina can see if you tend to be consistently positive, how you handle stress, or if your mood varies throughout the day.'
        },
        'Personality Traits': {
          title: 'What Makes You, You',
          description: 'The core personality traits that define who you are.',
          details: 'Are you analytical? Creative? Goal-oriented? Numina identifies your key personality traits from how you think and communicate, then uses this to give you responses that match your personality.'
        },
        'Profile Completeness': {
          title: 'How Complete Your Profile Is',
          description: 'Shows how much of your personality and behavior Numina has learned.',
          details: 'The more you chat, the more complete your profile becomes. A complete profile means Numina can give you better, more personalized responses and insights about yourself.'
        }
      };
      return explanations[metricName] || {
        title: metricName,
        description: 'Behavioral metric tracked by Numina AI.',
        details: 'This metric helps improve your personalized AI experience.'
      };
    };

    const explanation = getDetailedExplanation(metric.name);
    
    setSelectedMetric({
      ...metric,
      ...explanation
    });
    setShowMetricModal(true);
  };

  // Render insight card
  const renderInsightCard = (insight: InsightData) => {
    const categoryColors = {
      growth: designTokens.semantic.success,
      emotional: designTokens.semantic.info,
      behavioral: designTokens.semantic.wisdom,
      social: designTokens.semantic.love,
    };

    const categoryCode = {
      growth: 'GRW',
      emotional: 'EMO',
      behavioral: 'BEH',
      social: 'SOC',
    };

    return (
      <View 
        key={insight.id}
        style={[styles.metricCard, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}
      >
        {/* Header with ID and Status */}
        <View style={styles.metricHeader}>
          <Text style={[styles.metricId, { color: categoryColors[insight.category] }]}>
            #{categoryCode[insight.category]}-{insight.id.slice(-4).toUpperCase()}
          </Text>
          <View style={[styles.statusIndicator, { backgroundColor: categoryColors[insight.category] }]} />
        </View>
        
        {/* Main Metric Display */}
        <View style={styles.metricDisplay}>
          <Text style={[styles.metricValue, { color: categoryColors[insight.category] }]}>
            {Math.round(insight.confidence * 100)}
          </Text>
          <Text style={[styles.metricUnit, { color: themeColors.textMuted }]}>
            %CONF
          </Text>
        </View>
        
        {/* Technical Details */}
        <View style={styles.techDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
              TYPE:
            </Text>
            <Text style={[styles.detailValue, { color: themeColors.text }]}>
              {insight.category.toUpperCase()}_PATTERN
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
              TIMESTAMP:
            </Text>
            <Text style={[styles.detailValue, { color: themeColors.text }]}>
              {insight.timestamp}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
              STATUS:
            </Text>
            <Text style={[styles.detailValue, { color: categoryColors[insight.category] }]}>
              ACTIVE
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: themeColors.surfaces.sunken }]}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${insight.confidence * 100}%`,
                  backgroundColor: categoryColors[insight.category],
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressLabel, { color: themeColors.textMuted }]}>
            SIGNAL_STRENGTH
          </Text>
        </View>
      </View>
    );
  };

  // Header menu action handler now provided by useHeaderMenu hook

  // Render header
  const renderHeader = () => (
    <Header
      title="Personal Insights"
      
      showMenuButton={true}
      showBackButton={false}
      onMenuPress={toggleHeaderMenu}
      theme={theme as 'light' | 'dark'}
      isVisible={true}
      isActive={isLoading}
      isMenuOpen={showHeaderMenu}
    />
  );

  return (
    <PageBackground theme={theme as 'light' | 'dark'} variant="insights">
      <SafeAreaView style={styles.container}>
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
      
      {/* Loading Animation */}
      {(isLoading || isRefreshing) && (
        <View style={styles.loadingContainer}>
          <LottieLoader 
            style={styles.loadingAnimation}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isLoading && styles.scrollContentWithLoading
        ]}
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

        {/* Main Overview Card */}
        {metrics.length > 0 && (
          <View style={styles.overviewContainer}>
            <View style={[styles.overviewCard, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}>
              <View style={styles.overviewHeader}>
                <Text style={[styles.overviewTitle, { color: themeColors.text }]}>
                  Profile Overview
                </Text>
                <View style={[styles.overviewStatus, { backgroundColor: designTokens.semantic.success }]} />
              </View>
              
              <View style={styles.overviewContent}>
                <View style={styles.overviewMain}>
                  <Text style={[styles.overviewValue, { color: designTokens.semantic.info }]}>
                    {(() => {
                      const confidenceMetric = metrics.find(m => m.name === 'Profile Confidence');
                      const value = confidenceMetric?.value as string;
                      return value ? parseInt(value.replace('%', '')) : 0;
                    })()}
                  </Text>
                  <Text style={[styles.overviewUnit, { color: themeColors.textMuted }]}>
                    % READY
                  </Text>
                </View>
                
                <View style={styles.overviewStats}>
                  <View style={styles.overviewStat}>
                    <Text style={[styles.overviewStatValue, { color: designTokens.semantic.success }]}>
                      {metrics.find(m => m.name === 'Behavior Patterns')?.value || '0'}
                    </Text>
                    <Text style={[styles.overviewStatLabel, { color: themeColors.textMuted }]}>
                      Behaviors
                    </Text>
                  </View>
                  
                  <View style={styles.overviewStat}>
                    <Text style={[styles.overviewStatValue, { color: designTokens.semantic.wisdom }]}>
                      {metrics.find(m => m.name === 'Personality Traits')?.value || '0'}
                    </Text>
                    <Text style={[styles.overviewStatLabel, { color: themeColors.textMuted }]}>
                      Personality
                    </Text>
                  </View>
                  
                  <View style={styles.overviewStat}>
                    <Text style={[styles.overviewStatValue, { color: designTokens.semantic.love }]}>
                      {metrics.find(m => m.name === 'Emotions Analyzed')?.value || '0'}
                    </Text>
                    <Text style={[styles.overviewStatLabel, { color: themeColors.textMuted }]}>
                      Emotions
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.overviewProgress}>
                <View style={[styles.overviewProgressTrack, { backgroundColor: themeColors.surfaces.sunken }]}>
                  <View 
                    style={[
                      styles.overviewProgressFill,
                      { 
                        width: `${(() => {
                          const confidenceMetric = metrics.find(m => m.name === 'Profile Confidence');
                          const value = confidenceMetric?.value as string;
                          return value ? parseInt(value.replace('%', '')) : 0;
                        })()}%`,
                        backgroundColor: designTokens.semantic.info,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.overviewProgressLabel, { color: themeColors.textMuted }]}>
                  ANALYSIS_PROGRESS
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Metrics Grid */}
        {metrics.length > 0 && (
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
                  theme={theme as 'light' | 'dark'}
                  onPress={() => handleMetricPress(metric)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Charts */}
        {charts.length > 0 ? (
          charts.map((chart) => (
            <InsightChart
              key={chart.id}
              title={chart.title}
              subtitle={chart.subtitle}
              data={chart.data}
              type={chart.type}
              theme={theme as 'light' | 'dark'}
            />
          ))
        ) : (
          <View style={[styles.emptyState, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}>
            <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>
              🧠 Getting to Know You
            </Text>
            <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
              The more you chat with Numina, the better it understands your personality, communication style, and emotional patterns. Start a conversation to see your insights grow!
            </Text>
          </View>
        )}

      </ScrollView>
      
      {/* Header positioned absolutely */}
      {renderHeader()}
      
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
        theme={theme as 'light' | 'dark'}
      />

      {/* Metric Detail Modal */}
      <MetricDetailModal
        visible={showMetricModal}
        onClose={() => {
          setShowMetricModal(false);
          setSelectedMetric(null);
        }}
        metric={selectedMetric ? {
          title: selectedMetric.title || selectedMetric.name,
          description: selectedMetric.description || selectedMetric.subtitle || '',
          details: selectedMetric.details || 'No additional details available',
          value: selectedMetric.value,
          trendValue: selectedMetric.trendValue,
        } : null}
        theme={theme as 'light' | 'dark'}
        color={selectedMetric?.color}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
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
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80, // Match chat page padding for header
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

  // Overview Card
  overviewContainer: {
    paddingHorizontal: spacing[3],
    marginBottom: spacing[4],
  },
  overviewCard: {
    padding: spacing[5],
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  overviewTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  overviewStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  overviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  overviewMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overviewValue: {
    fontSize: 48,
    fontWeight: '800',
    fontFamily: 'Monaco',
    lineHeight: 52,
  },
  overviewUnit: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing[2],
    fontFamily: 'Monaco',
  },
  overviewStats: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewStatValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Monaco',
  },
  overviewStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing[1],
  },
  overviewProgress: {
    marginTop: spacing[3],
  },
  overviewProgressTrack: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing[2],
  },
  overviewProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overviewProgressLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Monaco',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[3], // Match chat page spacing
  },
  metricItem: {
    width: '50%',
    paddingHorizontal: spacing[2],
  },

  // Sections
  insightsSection: {
    marginHorizontal: spacing[3], // Match chat page margins
    marginVertical: spacing[4],
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

  // Metric Cards
  metricCard: {
    padding: spacing[4],
    borderRadius: 12,
    marginBottom: spacing[3],
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  metricId: {
    ...typography.textStyles.caption,
    fontFamily: 'Monaco',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing[4],
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'Monaco',
    lineHeight: 36,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing[1],
    fontFamily: 'Monaco',
  },
  techDetails: {
    marginBottom: spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Monaco',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Monaco',
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing[2],
  },
  progressContainer: {
    marginTop: spacing[2],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing[1],
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Monaco',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Empty State
  emptyState: {
    margin: spacing[4],
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
    borderRadius: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyStateTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.textStyles.body,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Loading Animation
  loadingContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 120, // Positioned below header
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 50,
    height: 50,
  },
  scrollContentWithLoading: {
    paddingTop: Platform.OS === 'ios' ? 180 : 160, // Extra padding when loading
  },
});

export default InsightsScreen;