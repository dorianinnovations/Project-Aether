/**
 * Numina - Personal Dashboard
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

interface DashboardData {
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

interface DashboardScreenProps {}

const DashboardScreen: React.FC<DashboardScreenProps> = () => {
  const { theme, colors } = useTheme();
  // State
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
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
    screenName: 'dashboard',
    onSettingsPress: () => setShowSettings(true),
    onSignOut: () => setShowSignOutModal(true)
  });
  
  // Animation values
  const [animationValues] = useState(() => getInitialAnimatedValues(6));

  // Use colors from theme context instead of getThemeColors
  const themeColors = colors;

  // Load dashboard data
  const loadDashboardData = async (showLoading = true) => {
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
        
        // Store UBPM data in state for modal access
        setCurrentUbpmData(ubpmData);
        
        // Check if user has real behavioral data or is still building profile
        if (ubpmData.status === 'building_profile') {
          // New user - show empty state
          processedMetrics = [];
          processedCharts = [];
        } else {
          // User has real behavioral patterns
          const behavioralPatterns = ubpmData.behavioralContext?.detectedPatterns || [];
          const emotionalPatterns = ubpmData.emotionalContext?.emotionalPatterns || [];
          
          // Extract personality traits from personalityContext (Big 5 model)
          const personalityTraits = ubpmData.personalityContext ? [
            { trait: 'openness', score: ubpmData.personalityContext.openness },
            { trait: 'conscientiousness', score: ubpmData.personalityContext.conscientiousness },
            { trait: 'extraversion', score: ubpmData.personalityContext.extraversion },
            { trait: 'agreeableness', score: ubpmData.personalityContext.agreeableness },
            { trait: 'neuroticism', score: ubpmData.personalityContext.neuroticism }
          ].filter(trait => trait.score > 0) : [];
          
          
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
          
          // Personality traits analyzed
          metricsArray.push({
            id: '4',
            name: 'Personality Traits',
            value: personalityTraits.length.toString(),
            trend: personalityTraits.length > 0 ? 'up' : 'neutral',
            trendValue: personalityTraits.length > 0 ? 'identified' : 'analyzing',
            color: 'warning',
            subtitle: 'Core aspects of who you are',
          });
          
          // Emotional pattern analysis (UBPM patterns)
          metricsArray.push({
            id: '5',
            name: 'Patterns',
            value: emotionalPatterns.length.toString(),
            trend: emotionalPatterns.length > 0 ? 'up' : 'neutral',
            trendValue: emotionalPatterns.length > 0 ? 'patterns found' : 'need more data',
            color: 'love',
            subtitle: 'How your UBPM changes over time',
          });

          // Data quality score
          metricsArray.push({
            id: '6',
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
      setDashboardData([]);

      // Trigger entrance animations
      if (showLoading) {
        createStaggeredEntrance(animationValues, {
          delay: 300,
          increment: 150,
          duration: 500,
        }).start();
      }

    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
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
    loadDashboardData();
  }, []);

  // Real-time polling for UBPM updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(false); // Refresh without loading state
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Execute API call and minimum duration in parallel for smooth UX
    await Promise.all([
      loadDashboardData(false),
      new Promise(resolve => setTimeout(resolve, 1200)) // Minimum 1.2 seconds
    ]);
  };

  // Add state to store current UBPM data for modal access
  const [currentUbpmData, setCurrentUbpmData] = useState<any>(null);

  // Handle metric card press
  const handleMetricPress = (metric: MetricData) => {
    const getActualUserData = (metricName: string) => {
      if (!currentUbpmData) {
        return {
          title: metricName,
          description: 'Loading data...',
          details: 'No data available yet. Chat more to build your profile!'
        };
      }
      
      // Extract data from current UBPM context
      const behavioralPatterns = currentUbpmData.behavioralContext?.detectedPatterns || [];
      const emotionalPatterns = currentUbpmData.emotionalContext?.emotionalPatterns || [];
      const personalityTraits = currentUbpmData.personalityContext ? [
        { trait: 'openness', score: currentUbpmData.personalityContext.openness },
        { trait: 'conscientiousness', score: currentUbpmData.personalityContext.conscientiousness },
        { trait: 'extraversion', score: currentUbpmData.personalityContext.extraversion },
        { trait: 'agreeableness', score: currentUbpmData.personalityContext.agreeableness },
        { trait: 'neuroticism', score: currentUbpmData.personalityContext.neuroticism }
      ].filter(trait => trait.score > 0) : [];
      
      const commStyle = currentUbpmData.behavioralContext?.communicationStyle || 'analyzing';
      const commStyleReadable = commStyle.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      
      switch (metricName) {
        case 'Profile Confidence':
          return {
            title: 'Your Profile Confidence',
            description: `${metric.value} confidence based on ${currentUbpmData?.dataPoints || 0} data points`,
            details: `Data Quality Score: ${Math.round((currentUbpmData?.dataQuality?.score || 0) * 100)}%\n\nQuality Indicators:\n• ${currentUbpmData?.dataQuality?.indicators?.join('\n• ') || 'No indicators available'}\n\nLast Updated: ${currentUbpmData?.lastUpdated ? new Date(currentUbpmData.lastUpdated).toLocaleDateString() : 'Unknown'}`
          };
          
        case 'Behavior Patterns':
          const patterns = behavioralPatterns.length > 0 ? behavioralPatterns : ['No patterns detected yet'];
          return {
            title: 'Your Detected Patterns',
            description: `${behavioralPatterns.length} behavioral patterns identified`,
            details: `Detected Patterns:\n• ${patterns.map((p: any) => p.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())).join('\n• ')}\n\nConfidence: ${Math.round((currentUbpmData?.behavioralContext?.confidence || 0) * 100)}%`
          };
          
        case 'Communication Style':
          return {
            title: 'Your Communication Style',
            description: `${commStyleReadable} communication style`,
            details: `Style: ${commStyleReadable}\nPreferred Mode: ${currentUbpmData?.behavioralContext?.preferredInteractionMode || 'Unknown'}\nResponse Time: ${currentUbpmData?.behavioralContext?.responseTime || 'Unknown'}\n\nTopic Preferences:\n• ${currentUbpmData?.behavioralContext?.topicPreferences?.join('\n• ') || 'None identified yet'}`
          };
          
        case 'Personality Traits':
          return {
            title: 'Your Personality Traits',
            description: `${personalityTraits.length} Big 5 traits analyzed`,
            details: personalityTraits.length > 0 ? 
              `Big 5 Personality Scores:\n\n${personalityTraits.map(trait => `${trait.trait.charAt(0).toUpperCase() + trait.trait.slice(1)}: ${Math.round(trait.score * 100)}%`).join('\n')}` :
              'No personality data available yet. Chat more to build your profile!'
          };
          
        case 'Emotional Patterns':
          const emotionalData = emotionalPatterns.length > 0 ? emotionalPatterns : [];
          return {
            title: 'Your Patterns',
            description: `${emotionalPatterns.length} emotional patterns found`,
            details: emotionalData.length > 0 ? 
              `Emotional Patterns:\n\n${emotionalData.map((p: any) => {
                if (typeof p === 'string') {
                  return `• ${p.replace(/_/g, ' ')}`;
                } else if (p && typeof p === 'object') {
                  // Format object data nicely instead of JSON.stringify
                  const type = p.type || p.pattern || 'Pattern';
                  const intensity = p.intensity ? ` (${Math.round(p.intensity * 100)}% intensity)` : '';
                  const frequency = p.frequency ? ` - ${p.frequency}` : '';
                  return `• ${type}${intensity}${frequency}`;
                } else {
                  return `• ${p}`;
                }
              }).join('\n')}` :
              'No emotional patterns detected yet. Continue chatting to see your patterns emerge!'
          };
          
        case 'Profile Completeness':
          return {
            title: 'Profile Completeness',
            description: `${metric.value} complete`,
            details: `Completeness: ${metric.value}\nFreshness: ${currentUbpmData?.dataQuality?.freshness ? Math.round(currentUbpmData.dataQuality.freshness * 100) + '%' : 'Unknown'}\n\nMost Active Hours: ${currentUbpmData?.temporalContext?.mostActiveHours?.join(', ') || 'Not enough data'}\nPreferred Session Length: ${currentUbpmData?.temporalContext?.preferredSessionLength || 'Unknown'} minutes\nConsistency Score: ${Math.round((currentUbpmData?.temporalContext?.consistencyScore || 0) * 100)}%`
          };
          
        default:
          return {
            title: metricName,
            description: 'No data available',
            details: 'This metric is being tracked but no specific data is available yet.'
          };
      }
    };

    const actualData = getActualUserData(metric.name);
    
    setSelectedMetric({
      ...metric,
      ...actualData
    });
    setShowMetricModal(true);
  };

  // Render dashboard card
  const renderDashboardCard = (item: DashboardData) => {
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
        key={item.id}
        style={[styles.metricCard, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}
      >
        {/* Header with Category and Status */}
        <View style={styles.metricHeader}>
          <Text style={[styles.metricId, { color: categoryColors[item.category] }]}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)} Pattern
          </Text>
          <View style={[styles.statusIndicator, { backgroundColor: categoryColors[item.category] }]} />
        </View>
        
        {/* Main Metric Display */}
        <View style={styles.metricDisplay}>
          <Text style={[styles.metricValue, { color: categoryColors[item.category] }]}>
            {Math.round(item.confidence * 100)}
          </Text>
          <Text style={[styles.metricUnit, { color: themeColors.textMuted }]}>
            %CONF
          </Text>
        </View>
        
        {/* Insight Details */}
        <View style={styles.techDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
              INSIGHT:
            </Text>
            <Text style={[styles.detailValue, { color: themeColors.text }]}>
              {item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
              DISCOVERED:
            </Text>
            <Text style={[styles.detailValue, { color: themeColors.text }]}>
              {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>
              STRENGTH:
            </Text>
            <Text style={[styles.detailValue, { color: categoryColors[item.category] }]}>
              {item.confidence > 0.8 ? 'HIGH' : item.confidence > 0.6 ? 'MEDIUM' : 'EMERGING'}
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
                  width: `${item.confidence * 100}%`,
                  backgroundColor: categoryColors[item.category],
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressLabel, { color: themeColors.textMuted }]}>
            CONFIDENCE_LEVEL
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
      isMenuOpen={showHeaderMenu}
    />
  );

  return (
    <PageBackground theme={theme as 'light' | 'dark'} variant="dashboard">
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
                      const totalDataPoints = currentUbpmData?.dataPoints || 0;
                      if (totalDataPoints === 0) return '0';
                      if (totalDataPoints < 10) return totalDataPoints.toString();
                      if (totalDataPoints < 100) return Math.floor(totalDataPoints / 10) * 10 + '+';
                      return Math.floor(totalDataPoints / 100) * 100 + '+';
                    })()}
                  </Text>
                  <Text style={[styles.overviewUnit, { color: themeColors.textMuted }]}>
                    MESSAGES
                  </Text>
                </View>
                
                <View style={styles.overviewStats}>
                  <View style={styles.overviewStat}>
                    <Text style={[styles.overviewStatValue, { color: designTokens.semantic.success }]}>
                      {(() => {
                        const commStyle = currentUbpmData?.behavioralContext?.communicationStyle || 'casual';
                        return commStyle.replace(/_/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase()).join('');
                      })()}
                    </Text>
                    <Text style={[styles.overviewStatLabel, { color: themeColors.textMuted }]}>
                      Style
                    </Text>
                  </View>
                  
                  <View style={styles.overviewStat}>
                    <Text style={[styles.overviewStatValue, { color: designTokens.semantic.wisdom }]}>
                      {(() => {
                        const hours = currentUbpmData?.temporalContext?.mostActiveHours || [];
                        if (hours.length === 0) return '—';
                        const avgHour = Math.round(hours.reduce((a: number, b: number) => a + b, 0) / hours.length);
                        if (avgHour < 6) return 'Night';
                        if (avgHour < 12) return 'Morning';
                        if (avgHour < 18) return 'Day';
                        return 'Evening';
                      })()}
                    </Text>
                    <Text style={[styles.overviewStatLabel, { color: themeColors.textMuted }]}>
                      Active
                    </Text>
                  </View>
                  
                  <View style={styles.overviewStat}>
                    <Text style={[styles.overviewStatValue, { color: designTokens.semantic.love }]}>
                      {(() => {
                        const sessionLength = currentUbpmData?.temporalContext?.preferredSessionLength || 0;
                        if (sessionLength === 0) return '—';
                        if (sessionLength < 5) return 'Quick';
                        if (sessionLength < 15) return 'Short';
                        if (sessionLength < 30) return 'Medium';
                        return 'Long';
                      })()}
                    </Text>
                    <Text style={[styles.overviewStatLabel, { color: themeColors.textMuted }]}>
                      Sessions
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
                          const totalMessages = currentUbpmData?.dataPoints || 0;
                          // More realistic progress based on actual data
                          if (totalMessages === 0) return 0;
                          if (totalMessages < 10) return Math.min(totalMessages * 8, 80);
                          if (totalMessages < 50) return Math.min(80 + (totalMessages - 10) * 2, 95);
                          return 100;
                        })()}%`,
                        backgroundColor: designTokens.semantic.info,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.overviewProgressLabel, { color: themeColors.textMuted }]}>
                  {(() => {
                    const totalMessages = currentUbpmData?.dataPoints || 0;
                    if (totalMessages === 0) return 'START_CHATTING';
                    if (totalMessages < 10) return 'LEARNING_BASICS';
                    if (totalMessages < 25) return 'BUILDING_PROFILE'; 
                    if (totalMessages < 50) return 'UNDERSTANDING_PATTERNS';
                    return 'PROFILE_COMPLETE';
                  })()}
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
              Getting to Know You
            </Text>
            <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
              The more you chat with, the better your AI understands your personality, communication style, and emotional patterns. Start a conversation to see your dashboard grow!
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
  dashboardSection: {
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

export default DashboardScreen;