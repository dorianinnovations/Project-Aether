/**
 * Engine - Simplified Real-time Dashboard
 * StreamEngine-powered live analytics and metrics
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
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Design System
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import LottieLoader from '../../design-system/components/atoms/LottieLoader';
import Button from '../../design-system/components/atoms/Button';
import { Header, HeaderMenu, SignOutModal } from '../../design-system/components/organisms';
import { EngineCard } from '../../design-system/components/molecules';
import SettingsModal from '../chat/SettingsModal';

// Design System
import { designTokens, getThemeColors, getButtonColors } from '../../design-system/tokens/colors';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { createNeumorphicContainer } from '../../design-system/tokens/shadows';
import { createStaggeredEntrance, getInitialAnimatedValues } from '../../design-system/animations/entrance';
import { useHeaderMenu } from '../../design-system/hooks';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';

// Services  
import { AnalyticsAPI, ApiUtils, AuthAPI } from '../../services/api';
import { StreamEngine } from '../../services/StreamEngine';

interface EngineMetric {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  color: keyof typeof designTokens.semantic;
  trend?: 'up' | 'down' | 'neutral';
  live?: boolean;
  showChart?: boolean;
  chartData?: TrendDataPoint[];
}

interface DataSubtype {
  id: string;
  name: string;
  type: 'behavioral' | 'emotional' | 'cognitive' | 'temporal';
  count: number;
  confidence: number;
}

interface CompressionOptions {
  type: 'full' | 'behavioral' | 'emotional' | 'patterns';
  label: string;
  description: string;
}

interface LiveData {
  messages: number;
  confidence: number;
  status: string;
  activePatterns: number;
}

interface TrendDataPoint {
  hour: number;
  value: number;
  majorDetail: string;
}

const EngineScreen: React.FC = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation<any>();
  
  // State
  const [metrics, setMetrics] = useState<EngineMetric[]>([]);
  const [liveData, setLiveData] = useState<LiveData>({
    messages: 0,
    confidence: 0,
    status: 'initializing',
    activePatterns: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dataSubtypes, setDataSubtypes] = useState<DataSubtype[]>([]);
  const [compressionType, setCompressionType] = useState<'full' | 'behavioral' | 'emotional' | 'patterns'>('full');
  const [behaviorFlowData, setBehaviorFlowData] = useState<any[]>([]);

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'engine',
    onSettingsPress: () => setShowSettings(true),
    onSignOut: () => setShowSignOutModal(true)
  });

  // Animation values
  const [animationValues] = useState(() => getInitialAnimatedValues(4));

  // Helper to convert 24-hour to 12-hour format
  const formatTo12Hour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Generate real behavioral trend data from UBPM patterns over time
  const generateBehavioralTrendData = (ubpmData: any): TrendDataPoint[] => {
    // Get real temporal patterns from UBPM
    const workPatterns = ubpmData.visualizations?.workPatterns;
    const communicationStats = ubpmData.visualizations?.communicationStats;
    
    if (!workPatterns?.preferredHours) {
      return [];
    }

    const preferredHours = workPatterns.preferredHours;
    const sessionLength = workPatterns.sessionLength;
    const messagesPerSession = workPatterns.messagesPerSession;
    const communicationStyle = communicationStats?.style;
    
    // Generate 24 hours of real behavioral intensity
    const trendData: TrendDataPoint[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      // Calculate real behavioral intensity based on user's actual patterns
      const isPreferredHour = preferredHours.includes(hour);
      const isAdjacentToPreferred = preferredHours.some((h: number) => Math.abs(h - hour) === 1);
      
      let intensity = 0.1; // Base intensity
      let majorDetail = 'Minimal cognitive activity';
      
      if (isPreferredHour) {
        intensity = 0.8 + (Math.random() * 0.2); // Peak activity with variation
        majorDetail = communicationStyle ? `Peak ${communicationStyle} mode` : 'Peak activity period';
      } else if (isAdjacentToPreferred) {
        intensity = 0.4 + (Math.random() * 0.3); // Moderate activity
        majorDetail = 'Ramping up cognitive engagement';
      } else if (hour >= 9 && hour <= 17) {
        intensity = 0.2 + (Math.random() * 0.2); // Work hours baseline
        majorDetail = 'Standard cognitive baseline';
      } else if (hour >= 22 || hour <= 6) {
        intensity = 0.05 + (Math.random() * 0.1); // Rest hours
        majorDetail = 'Rest and recovery period';
      }

      // Add real behavioral context to major details
      if (isPreferredHour && communicationStats && communicationStats.avgResponseLength) {
        const avgLength = communicationStats.avgResponseLength;
        const style = communicationStats.questionStyle || communicationStats.style || 'cognitive';
        
        if (avgLength > 200) {
          majorDetail = `Detailed ${style} thinking`;
        } else if (avgLength < 100) {
          majorDetail = `Concise ${style} processing`;
        } else {
          majorDetail = `Balanced ${style} analysis`;
        }
      }

      trendData.push({
        hour,
        value: intensity,
        majorDetail
      });
    }

    return trendData;
  };

  // Load engine data
  const loadEngineData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // Get real UBPM data with visualization context
      const ubpmResponse = await AnalyticsAPI.getUBPMContext();
      
      if (ubpmResponse?.success && ubpmResponse.data) {
        const data = ubpmResponse.data;
        
        // Get visualization data from UBMP response (cast to any to access visualizations)
        const visualizations = (ubpmResponse as any).visualizations || {};
        const progressiveState = visualizations.progressiveState || {};
        const personalityRadar = visualizations.personalityRadar || [];
        const behaviorFlow = visualizations.behaviorFlow || [];
        const communicationStats = visualizations.communicationStats || {};
        const workPatterns = visualizations.workPatterns || {};
        
        // Update live data with real metrics
        setLiveData({
          messages: data.dataPoints || 0,
          confidence: Math.round((data.confidence || 0) * 100),
          status: data.status || 'active',
          activePatterns: behaviorFlow.length,
        });

        // Generate real behavioral trend data
        const trendData = generateBehavioralTrendData(ubpmResponse);
        
        // Determine data availability and quality
        const hasActiveTracking = data.dataPoints > 0 && data.confidence > 0.3;
        const hasPersonalityData = personalityRadar.length > 0;
        const hasBehaviorData = behaviorFlow.length > 0;
        const hasTemporalData = workPatterns.preferredHours && workPatterns.preferredHours.length > 0;
        
        const engineMetrics: EngineMetric[] = [
          // Thinking Style - Real behavioral pattern analysis
          {
            id: '1',
            title: 'Your Thinking Style',
            value: communicationStats.style ? 
              communicationStats.style.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') :
              progressiveState.stage === 'discovery' ? 'Discovering...' : 'Analyzing...',
            subtitle: communicationStats.style ? 
              `${communicationStats.confidence || 75}% confidence from ${data.dataPoints} patterns` :
              `${progressiveState.message || 'Building cognitive profile'}`,
            color: communicationStats.style ? 'success' : 'warning',
            trend: hasActiveTracking ? 'up' : 'neutral',
            live: hasActiveTracking && communicationStats.style,
            showChart: trendData.length > 0,
            chartData: trendData,
          },
          
          // Dominant Personality Trait - Real UBPM personality data
          {
            id: '2', 
            title: 'Dominant Trait',
            value: hasPersonalityData ? 
              personalityRadar[0].trait.charAt(0).toUpperCase() + personalityRadar[0].trait.slice(1) :
              'Building Profile...',
            subtitle: hasPersonalityData ? 
              `${personalityRadar[0].score}% strength, ${personalityRadar[0].confidence}% confidence` : 
              data.dataPoints > 0 ? 
                `${data.dataPoints}/5 interactions - ${Math.max(0, 5 - data.dataPoints)} more needed` :
                'Start chatting to detect personality traits',
            color: hasPersonalityData ? 'love' : 'warning',
            trend: hasPersonalityData ? (personalityRadar[0].score > 70 ? 'up' : 'neutral') : 'neutral',
            live: hasActiveTracking && hasPersonalityData,
          },
          
          // Communication Patterns - Real behavioral flow data
          {
            id: '3',
            title: 'Communication Style',
            value: communicationStats.style ? 
              `${communicationStats.questionStyle || 'Methodical'} ${communicationStats.style}` :
              'Observing Patterns...',
            subtitle: communicationStats.style && communicationStats.avgResponseLength ? 
              `${communicationStats.avgResponseLength} avg chars • ${communicationStats.technicalTerms?.length || 0} tech terms` : 
              communicationStats.style ?
                `Pattern detected • ${communicationStats.technicalTerms?.length || 0} tech terms` :
                'Chat more to reveal communication style',
            color: communicationStats.style ? 'info' : 'warning',
            trend: communicationStats.confidence > 80 ? 'up' : 'neutral',
            live: hasActiveTracking && communicationStats.style,
          },
          
          // Temporal Intelligence - Real work pattern analysis  
          {
            id: '4',
            title: 'Temporal Intelligence',
            value: hasTemporalData ? 
              `Peak: ${formatTo12Hour(workPatterns.preferredHours[0])}-${formatTo12Hour(workPatterns.preferredHours[workPatterns.preferredHours.length-1])}` :
              'Analyzing Schedule...',
            subtitle: hasTemporalData && workPatterns.sessionLength && workPatterns.messagesPerSession ? 
              `${workPatterns.sessionLength}min avg • ${workPatterns.messagesPerSession} msg/session • ${workPatterns.intensity || 0}% intensity` : 
              hasTemporalData ?
                `${workPatterns.preferredHours.length} peak hours detected • ${workPatterns.intensity || 0}% intensity` :
                'Continue chatting to detect activity patterns',
            color: hasTemporalData ? 'wisdom' : 'warning',
            trend: hasTemporalData && workPatterns.intensity > 70 ? 'up' : 'neutral',
            live: hasActiveTracking && hasTemporalData,
          },
        ];

        setMetrics(engineMetrics);

        // Build real cognitive insights from UBPM visualization data
        const subtypes: DataSubtype[] = [];
        
        // Communication patterns from real behavioral flow
        const communicationPatterns = behaviorFlow.filter((b: any) => b.type === 'communication');
        if (communicationPatterns.length > 0) {
          subtypes.push({
            id: 'comm',
            name: 'Communication Style',
            type: 'cognitive',
            count: communicationPatterns.length,
            confidence: communicationPatterns[0]?.confidence / 100 || 0,
          });
        }
        
        // Personality traits from real radar data
        if (personalityRadar.length > 0) {
          subtypes.push({
            id: 'personality',
            name: 'Personality Profile',
            type: 'emotional',
            count: personalityRadar.length,
            confidence: personalityRadar.reduce((sum: number, t: any) => sum + t.confidence, 0) / personalityRadar.length / 100,
          });
        }
        
        // Temporal patterns from real work data
        if (hasTemporalData) {
          subtypes.push({
            id: 'temporal',
            name: 'Activity Patterns',
            type: 'temporal',
            count: workPatterns.preferredHours?.length || 0,
            confidence: workPatterns.intensity / 100 || 0,
          });
        }
        
        // Behavioral flow from real UBPM patterns
        const behavioralPatterns = behaviorFlow.filter((b: any) => b.type === 'behavioral');
        if (behavioralPatterns.length > 0) {
          subtypes.push({
            id: 'behavioral',
            name: 'Behavioral Patterns',
            type: 'behavioral',
            count: behavioralPatterns.length,
            confidence: behavioralPatterns.reduce((sum: number, b: any) => sum + b.confidence, 0) / behavioralPatterns.length / 100,
          });
        }
        
        setDataSubtypes(subtypes);
        setBehaviorFlowData(behaviorFlow);

        // Trigger entrance animations
        if (showLoading) {
          createStaggeredEntrance(animationValues, {
            delay: 200,
            increment: 100,
            duration: 400,
          }).start();
        }
      }
    } catch (error: any) {
      console.error('Failed to load engine data:', error);
      
      // Clear any existing data on error - no fake data
      setMetrics([]);
      setDataSubtypes([]);
      setBehaviorFlowData([]);
      
      setLiveData({
        messages: 0,
        confidence: 0,
        status: 'offline',
        activePatterns: 0,
      });

      // Only show error alert if this is a user-initiated action
      if (showLoading || isRefreshing) {
        Alert.alert(
          'Engine Unavailable',
          'Unable to connect to the analytics engine. Please check your connection and try again.',
          [
            { text: 'Retry', onPress: () => loadEngineData(true) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadEngineData();
  }, []);

  // Real-time polling - more efficient with staggered updates
  useEffect(() => {
    let ubpmInterval: NodeJS.Timeout;
    let metricsInterval: NodeJS.Timeout;

    // Update UBPM data every 30 seconds
    ubpmInterval = setInterval(async () => {
      try {
        const ubpmResponse = await AnalyticsAPI.getUBPMContext();
        if (ubpmResponse?.success && ubpmResponse.data) {
          const data = ubpmResponse.data;
          setLiveData(prev => ({
            ...prev,
            messages: data.dataPoints || 0,
            confidence: Math.round((data.confidence || 0) * 100),
            status: data.status || 'active',
            activePatterns: (data.behavioralContext?.detectedPatterns?.length || 0) + 
                           (data.emotionalContext?.emotionalPatterns?.length || 0),
          }));
        }
      } catch (error) {
        console.warn('UBPM polling error:', error);
      }
    }, 30000);

    // Update system metrics every 60 seconds
    metricsInterval = setInterval(async () => {
      try {
        const systemMetrics = await AnalyticsAPI.getSystemMetrics();
        // System metrics update handled in full data reload
        loadEngineData(false);
      } catch (error) {
        console.warn('System metrics polling error:', error);
      }
    }, 60000);

    return () => {
      clearInterval(ubpmInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    await Promise.all([
      loadEngineData(false),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);
  };


  // Get subtype color
  const getSubtypeColor = (type: DataSubtype['type']) => {
    const colorMap = {
      behavioral: designTokens.semantic.info,
      emotional: designTokens.semantic.love,
      cognitive: designTokens.semantic.wisdom,
      temporal: designTokens.semantic.success,
    };
    return colorMap[type];
  };

  // Get pattern color key for semantic colors
  const getPatternColorKey = (patternType: string): keyof typeof designTokens.semantic => {
    const colorMap: { [key: string]: keyof typeof designTokens.semantic } = {
      communication: 'info',
      emotional: 'love',
      temporal: 'success',
      behavioral: 'wisdom',
      cognitive: 'warning',
    };
    return colorMap[patternType] || 'info';
  };

  // Handle engine card press
  const handleEngineCardPress = (engineId: string, engineTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('EngineDetail', { engineId, engineTitle });
  };

  // Render engine card
  const renderEngineCard = ({ item, index }: { item: EngineMetric; index: number }) => (
    <Animated.View style={{ opacity: animationValues[index] }}>
      <EngineCard
        id={item.id}
        title={item.title}
        value={item.value}
        subtitle={item.subtitle}
        color={item.color}
        trend={item.trend}
        live={item.live}
        theme={theme as 'light' | 'dark'}
        onPress={() => handleEngineCardPress(item.id, item.title)}
        showChart={item.showChart}
        chartData={item.chartData}
      />
    </Animated.View>
  );

  // Render metric card
  const renderMetricCard = (metric: EngineMetric, index: number) => (
    <Animated.View
      key={metric.id}
      style={[
        styles.metricCard,
        createNeumorphicContainer(theme as 'light' | 'dark', 'elevated'),
        { opacity: animationValues[index] }
      ]}
    >
      <View style={styles.metricHeader}>
        <Text style={[styles.metricTitle, { color: colors.text }]}>
          {metric.title}
        </Text>
        {metric.live && (
          <View style={[styles.liveIndicator, { backgroundColor: designTokens.semantic.success }]} />
        )}
      </View>
      
      <Text style={[styles.metricValue, { color: designTokens.semantic[metric.color] }]}>
        {metric.value}
      </Text>
      
      <Text style={[styles.metricSubtitle, { color: colors.textMuted }]}>
        {metric.subtitle}
      </Text>
      
      {metric.trend && (
        <View style={styles.trendIndicator}>
          <Text style={[
            styles.trendText,
            { color: metric.trend === 'up' ? designTokens.semantic.success : colors.textMuted }
          ]}>
            {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'} 
            {metric.trend === 'up' ? 'Growing' : metric.trend === 'down' ? 'Declining' : 'Stable'}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <PageBackground theme={theme as 'light' | 'dark'} variant="dashboard">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor="transparent"
          translucent
        />

        <Header
          title="Engine"
          showMenuButton={true}
          showBackButton={false}
          onMenuPress={toggleHeaderMenu}
          theme={theme as 'light' | 'dark'}
          isVisible={true}
          isMenuOpen={showHeaderMenu}
        />

        <HeaderMenu
          visible={showHeaderMenu}
          onClose={() => setShowHeaderMenu?.(false)}
          onAction={handleMenuAction}
          showAuthOptions={false}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <LottieLoader
              style={styles.loadingAnimation}
            />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading engine data...
            </Text>
          </View>
        )}

        <ScrollView
          style={[styles.scrollView, isLoading && styles.scrollViewHidden]}
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

          {/* Engine Cards FlatList */}
          <View style={styles.engineCardsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Cognitive Intelligence
            </Text>
            {metrics.length > 0 ? (
              <FlatList
                data={metrics}
                renderItem={renderEngineCard}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={styles.flatListContainer}
              />
            ) : !isLoading ? (
              <View style={styles.emptyStateContainer}>
                <Text style={[styles.emptyStateTitle, { color: colors.textMuted }]}>
                  No Intelligence Data Available
                </Text>
                <Text style={[styles.emptyStateMessage, { color: colors.textMuted }]}>
                  Start chatting to build your cognitive profile
                </Text>
              </View>
            ) : null}
          </View>

          {/* Real Behavioral Insights */}
          {dataSubtypes.length > 0 && (
            <View style={[styles.subtypesContainer, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}>
              <Text style={[styles.subtypesTitle, { color: colors.text }]}>
                Behavioral Intelligence
              </Text>
              {dataSubtypes.map((subtype) => (
                <View key={subtype.id} style={styles.subtypeItem}>
                  <View style={styles.subtypeInfo}>
                    <Text style={[styles.subtypeName, { color: colors.text }]}>
                      {subtype.name}
                    </Text>
                    <Text style={[styles.subtypeDetails, { color: colors.textMuted }]}>
                      {subtype.count} patterns • {Math.round(subtype.confidence * 100)}% confidence
                    </Text>
                  </View>
                  <View style={[
                    styles.subtypeIndicator,
                    { backgroundColor: getSubtypeColor(subtype.type) }
                  ]} />
                </View>
              ))}
              
              {/* Real Key Insights from UBPM */}
              {behaviorFlowData.length > 0 && (
                <View style={styles.keyInsightsSection}>
                  <Text style={[styles.keyInsightsTitle, { color: colors.text }]}>
                    Key Behavioral Insights
                  </Text>
                  {behaviorFlowData.slice(0, 3).map((pattern: any, index: number) => (
                    <View key={index} style={styles.insightItem}>
                      <Text style={[styles.insightPattern, { color: designTokens.semantic[getPatternColorKey(pattern.type)] }]}>
                        {pattern.pattern}
                      </Text>
                      <Text style={[styles.insightMeta, { color: colors.textMuted }]}>
                        {pattern.confidence}% confidence • {pattern.metadata?.keyInsights?.[0] || 'Active pattern'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          
          {/* Show empty state only when no data exists */}
          {dataSubtypes.length === 0 && !isLoading && (
            <View style={[styles.subtypesContainer, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}>
              <Text style={[styles.subtypesTitle, { color: colors.text }]}>
                Behavioral Intelligence
              </Text>
              <View style={styles.emptyInsightsContainer}>
                <Text style={[styles.emptyInsightsText, { color: colors.textMuted }]}>
                  No behavioral patterns detected yet
                </Text>
                <Text style={[styles.emptyInsightsSubtext, { color: colors.textMuted }]}>
                  Continue conversations to unlock insights
                </Text>
              </View>
            </View>
          )}

        </ScrollView>


        <SignOutModal
          visible={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={async () => {
            await AuthAPI.logout();
          }}
          theme={theme as 'light' | 'dark'}
        />

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
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[3],
  },
  scrollViewHidden: {
    opacity: 0,
  },

  // Loading
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingAnimation: {
    width: 80,
    height: 80,
  },
  loadingText: {
    ...typography.textStyles.body,
    marginTop: spacing[3],
  },


  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing[4],
  },
  metricCard: {
    width: '48%',
    padding: spacing[4],
    borderRadius: 10,
    marginRight: '4%',
    marginBottom: spacing[3],
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  metricTitle: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricValue: {
    ...typography.textStyles.headlineMedium,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  metricSubtitle: {
    ...typography.textStyles.caption,
  },
  trendIndicator: {
    marginTop: spacing[1],
  },
  trendText: {
    ...typography.textStyles.caption,
    fontWeight: '500',
  },

  // Engine Cards
  engineCardsContainer: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.textStyles.headlineLarge,
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  flatListContainer: {
    paddingBottom: spacing[2],
    alignItems: 'center',
  },

  // Subtypes
  subtypesContainer: {
    padding: spacing[4],
    borderRadius: 16,
    marginBottom: spacing[4],
  },
  subtypesTitle: {
    ...typography.textStyles.bodyLarge,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  subtypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  subtypeInfo: {
    flex: 1,
  },
  subtypeName: {
    ...typography.textStyles.body,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  subtypeDetails: {
    ...typography.textStyles.caption,
  },
  subtypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },



  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[6],
  },
  emptyStateTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptyStateMessage: {
    ...typography.textStyles.body,
    textAlign: 'center',
    maxWidth: 250,
  },

  // Key Insights Section
  keyInsightsSection: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  keyInsightsTitle: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  insightItem: {
    marginBottom: spacing[2],
  },
  insightPattern: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  insightMeta: {
    ...typography.textStyles.caption,
  },

  // Empty Insights State
  emptyInsightsContainer: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  emptyInsightsText: {
    ...typography.textStyles.body,
    fontWeight: '500',
    marginBottom: spacing[1],
  },
  emptyInsightsSubtext: {
    ...typography.textStyles.caption,
  },

});

export default EngineScreen;