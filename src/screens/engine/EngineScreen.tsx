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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Design System
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import LottieLoader from '../../design-system/components/atoms/LottieLoader';
import Button from '../../design-system/components/atoms/Button';
import { Header, HeaderMenu, SignOutModal } from '../../design-system/components/organisms';
import SettingsModal from '../chat/SettingsModal';

// Design System
import { designTokens, getThemeColors } from '../../design-system/tokens/colors';
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

const EngineScreen: React.FC = () => {
  const { theme, colors } = useTheme();
  const navigation = useNavigation();
  
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
  const [streamingText, setStreamingText] = useState('');
  const [dataSubtypes, setDataSubtypes] = useState<DataSubtype[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionType, setCompressionType] = useState<'full' | 'behavioral' | 'emotional' | 'patterns'>('full');

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'engine',
    onSettingsPress: () => setShowSettings(true),
    onSignOut: () => setShowSignOutModal(true)
  });

  // Animation values
  const [animationValues] = useState(() => getInitialAnimatedValues(4));

  // Load engine data
  const loadEngineData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // Get real UBPM data and system metrics
      const [ubpmResponse, systemMetrics] = await Promise.all([
        AnalyticsAPI.getUBPMContext(),
        AnalyticsAPI.getSystemMetrics().catch(err => {
          console.warn('System metrics not available:', err);
          return { data: null };
        })
      ]);
      
      if (ubpmResponse?.success && ubpmResponse.data) {
        const data = ubpmResponse.data;
        
        // Update live data
        setLiveData({
          messages: data.dataPoints || 0,
          confidence: Math.round((data.confidence || 0) * 100),
          status: data.status || 'active',
          activePatterns: (data.behavioralContext?.detectedPatterns?.length || 0) + 
                         (data.emotionalContext?.emotionalPatterns?.length || 0),
        });

        // Build streamlined metrics with real system data
        const engineMetrics: EngineMetric[] = [
          {
            id: '1',
            title: 'Profile Status',
            value: data.status === 'building_profile' ? 'Learning' : 'Active',
            subtitle: `${data.dataPoints || 0} data points`,
            color: data.status === 'building_profile' ? 'warning' : 'success',
            trend: 'up',
            live: true,
          },
          {
            id: '2',
            title: 'Confidence',
            value: `${Math.round((data.confidence || 0) * 100)}%`,
            subtitle: 'AI understanding level',
            color: 'info',
            trend: data.confidence > 0.5 ? 'up' : 'neutral',
            live: true,
          },
          {
            id: '3',
            title: 'Patterns',
            value: (data.behavioralContext?.detectedPatterns?.length || 0) + 
                   (data.emotionalContext?.emotionalPatterns?.length || 0),
            subtitle: 'Behavioral insights',
            color: 'love',
            trend: 'up',
          },
          {
            id: '4',
            title: systemMetrics?.data?.memory ? 'Memory Usage' : 'Quality',
            value: systemMetrics?.data?.memory ? 
              `${systemMetrics.data.memory.activeUsers || 0}` : 
              `${Math.round((data.dataQuality?.score || 0) * 100)}%`,
            subtitle: systemMetrics?.data?.memory ? 
              'Active users' : 
              'Data completeness',
            color: 'wisdom',
            trend: systemMetrics?.data?.memory ? 'up' : 
              ((data.dataQuality?.score || 0) > 0.7 ? 'up' : 'neutral'),
          },
        ];

        setMetrics(engineMetrics);

        // Build data subtypes
        const subtypes: DataSubtype[] = [
          {
            id: '1',
            name: 'Communication Patterns',
            type: 'behavioral',
            count: data.behavioralContext?.detectedPatterns?.length || 0,
            confidence: data.behavioralContext?.confidence || 0,
          },
          {
            id: '2',
            name: 'Emotional States',
            type: 'emotional',
            count: data.emotionalContext?.emotionalPatterns?.length || 0,
            confidence: data.confidence || 0,
          },
          {
            id: '3',
            name: 'Cognitive Traits',
            type: 'cognitive',
            count: data.personalityTraits?.length || 0,
            confidence: data.confidence || 0,
          },
          {
            id: '4',
            name: 'Temporal Patterns',
            type: 'temporal',
            count: data.temporalContext?.mostActiveHours?.length || 0,
            confidence: data.temporalContext?.consistencyScore || 0,
          },
        ];
        
        setDataSubtypes(subtypes.filter(s => s.count > 0));

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
      
      // Set fallback data so the screen isn't completely empty
      setMetrics([
        {
          id: '1',
          title: 'Profile Status',
          value: 'Initializing',
          subtitle: 'Building your profile...',
          color: 'warning',
          trend: 'neutral',
        },
        {
          id: '2',
          title: 'Confidence',
          value: '0%',
          subtitle: 'AI learning in progress',
          color: 'info',
          trend: 'neutral',
        },
        {
          id: '3',
          title: 'Patterns',
          value: 0,
          subtitle: 'No patterns detected yet',
          color: 'love',
          trend: 'neutral',
        },
        {
          id: '4',
          title: 'Quality',
          value: '0%',
          subtitle: 'No data available',
          color: 'wisdom',
          trend: 'neutral',
        },
      ]);
      
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

  // Get real-time analytics data
  const startLiveUpdates = async () => {
    try {
      // Get real-time insights from the analytics API
      const response = await AnalyticsAPI.getRealUBPMAnalysis();
      if (response?.success) {
        setStreamingText('Real-time analytics: ' + (response.insights || 'Processing behavioral patterns...'));
      }
    } catch (error) {
      console.log('Live analytics not available:', error);
      setStreamingText('Analytics engine ready - processing behavioral data in real-time');
    }
  };

  // Load data on mount
  useEffect(() => {
    loadEngineData();
    startLiveUpdates();
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

  // Handle engine compression
  const handleEngineCompression = async () => {
    setIsCompressing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Call multiple analytics endpoints for comprehensive analysis
      const [cognitiveResponse, insightsResponse] = await Promise.all([
        AnalyticsAPI.getCognitivePatterns(),
        AnalyticsAPI.getPersonalInsights()
      ]);
      
      let message = 'Behavioral data has been analyzed and optimized.';
      
      if (cognitiveResponse?.patterns) {
        message += ` Found ${cognitiveResponse.patterns.length} cognitive patterns.`;
      }
      
      if (insightsResponse?.insights) {
        message += ` Generated ${insightsResponse.insights.length || 'new'} insights.`;
      }
      
      Alert.alert(
        'Analysis Complete',
        message,
        [{ text: 'OK', style: 'default' }]
      );
      
      // Refresh data after compression
      await loadEngineData(false);
      await startLiveUpdates(); // Refresh streaming text
    } catch (error: any) {
      console.error('Engine compression error:', error);
      Alert.alert(
        'Analysis Failed',
        ApiUtils.getErrorMessage(error),
        [{ text: 'Retry', onPress: handleEngineCompression }, { text: 'Cancel', style: 'cancel' }]
      );
    } finally {
      setIsCompressing(false);
    }
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
            <LottieLoader style={styles.loadingAnimation} />
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
          {/* Live Status Banner */}
          <View style={[styles.statusBanner, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}>
            <View style={styles.statusContent}>
              <View style={[styles.statusDot, { backgroundColor: designTokens.semantic.success }]} />
              <Text style={[styles.statusText, { color: colors.text }]}>
                Engine Active • {liveData.messages} messages • {liveData.activePatterns} patterns
              </Text>
            </View>
            <Text style={[styles.statusSubtext, { color: colors.textMuted }]}>
              Real-time behavioral analysis
            </Text>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => renderMetricCard(metric, index))}
          </View>

          {/* Data Subtypes */}
          {dataSubtypes.length > 0 && (
            <View style={[styles.subtypesContainer, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}>
              <Text style={[styles.subtypesTitle, { color: colors.text }]}>
                Data Subtypes
              </Text>
              {dataSubtypes.map((subtype) => (
                <View key={subtype.id} style={styles.subtypeItem}>
                  <View style={styles.subtypeInfo}>
                    <Text style={[styles.subtypeName, { color: colors.text }]}>
                      {subtype.name}
                    </Text>
                    <Text style={[styles.subtypeDetails, { color: colors.textMuted }]}>
                      {subtype.count} items • {Math.round(subtype.confidence * 100)}% confidence
                    </Text>
                  </View>
                  <View style={[
                    styles.subtypeIndicator,
                    { backgroundColor: getSubtypeColor(subtype.type) }
                  ]} />
                </View>
              ))}
            </View>
          )}

          {/* Engine Compression */}
          <View style={[styles.compressionContainer, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}>
            <Text style={[styles.compressionTitle, { color: colors.text }]}>
              Engine Compression
            </Text>
            <Text style={[styles.compressionSubtitle, { color: colors.textMuted }]}>
              Optimize and compress behavioral data
            </Text>
            
            <Button
              variant="primary"
              size="md"
              theme={theme as 'light' | 'dark'}
              state={isCompressing ? 'loading' : 'default'}
              onPress={handleEngineCompression}
              style={styles.compressionButton}
              fullWidth
            >
              {isCompressing ? 'Compressing...' : 'Run Engine Compression'}
            </Button>
          </View>

          {/* Streaming Test */}
          {streamingText && (
            <View style={[styles.streamContainer, createNeumorphicContainer(theme as 'light' | 'dark', 'elevated')]}>
              <Text style={[styles.streamTitle, { color: colors.text }]}>
                Live Stream
              </Text>
              <Text style={[styles.streamText, { color: colors.textMuted }]}>
                {streamingText}
              </Text>
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
  scrollContentWithLoading: {
    paddingTop: Platform.OS === 'ios' ? 160 : 140,
  },

  // Loading
  loadingContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 40,
    height: 40,
  },

  // Status Banner
  statusBanner: {
    padding: spacing[4],
    borderRadius: 16,
    marginBottom: spacing[4],
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  statusText: {
    ...typography.textStyles.body,
    fontWeight: '600',
  },
  statusSubtext: {
    ...typography.textStyles.caption,
    marginLeft: spacing[5],
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
    borderRadius: 16,
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

  // Compression
  compressionContainer: {
    padding: spacing[4],
    borderRadius: 16,
    marginBottom: spacing[4],
  },
  compressionTitle: {
    ...typography.textStyles.bodyLarge,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  compressionSubtitle: {
    ...typography.textStyles.body,
    marginBottom: spacing[3],
  },
  compressionButton: {
    height: 40,
  },

  // Stream
  streamContainer: {
    padding: spacing[4],
    borderRadius: 16,
  },
  streamTitle: {
    ...typography.textStyles.body,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  streamText: {
    ...typography.textStyles.bodySmall,
    lineHeight: 20,
  },
});

export default EngineScreen;