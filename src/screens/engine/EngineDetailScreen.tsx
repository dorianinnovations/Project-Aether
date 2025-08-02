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
  const [ubpmData, setUbpmData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation values
  const [animationValues] = useState(() => getInitialAnimatedValues(6));

  // Generate detail data from real UBPM data to match main screen
  const getCognitiveDetailDataFromUBPM = (id: string, title: string, ubpmData: any): EngineDetailData => {
    // Extract the same data used in main screen
    const personalityTraits = ubpmData.personalityTraits || [];
    const topTrait = personalityTraits.length > 0 ? 
      personalityTraits.sort((a: any, b: any) => b.score - a.score)[0] : null;
    
    const behavioralPatterns = ubpmData.behavioralContext?.detectedPatterns || [];
    const communicationPattern = behavioralPatterns.find((p: string) => 
      p.includes('communicator') || p.includes('questioner') || p.includes('analyzer')
    );
    
    // Map known cognitive archetypes to user-friendly names (same as main screen)
    const cognitiveArchetypes = {
      'systematic_analyzer': 'Systematic Analyzer',
      'socratic_questioner': 'Socratic Questioner', 
      'pragmatic_builder': 'Pragmatic Builder',
      'empathetic_connector': 'Empathetic Connector',
      'intellectual_challenger': 'Intellectual Challenger',
      'creative_synthesizer': 'Creative Synthesizer',
      'reflective_philosopher': 'Reflective Philosopher',
      'adaptive_explorer': 'Adaptive Explorer',
      'detailed_communicator': 'Detail-Oriented',
      'brief_communicator': 'Efficient',
      'inquisitive_learner': 'Curious Learner'
    };
    
    const getArchetypeName = (pattern: string) => {
      for (const [key, name] of Object.entries(cognitiveArchetypes)) {
        if (pattern.includes(key)) return name;
      }
      return pattern.replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    // Generate data that matches exactly what's shown on the main card
    const realData = {
      '1': { // Cognitive Archetype
        currentValue: communicationPattern ? 
          getArchetypeName(communicationPattern) :
          (ubpmData.status === 'building_profile' ? 'Discovering...' : 'Systematic Analyzer'),
        subtitle: communicationPattern ? 
          'Behavioral archetype identified' : 
          `Analyzing from ${ubpmData.dataPoints || 0} interactions`,
        color: communicationPattern ? 'success' as const : 'warning' as const,
        insights: [], // No fake insights - use real UBPM data only
        subMetrics: [
          { name: 'Pattern Confidence', value: communicationPattern ? '87%' : '23%', change: '+5%', color: designTokens.semantic.success },
          { name: 'Data Points', value: `${ubpmData.dataPoints || 0}`, change: '+12', color: designTokens.semantic.info },
          { name: 'Archetype Stability', value: communicationPattern ? 'High' : 'Building', change: 'Growing', color: designTokens.semantic.success },
          { name: 'Behavioral Match', value: communicationPattern ? '94%' : '45%', change: '+3%', color: designTokens.semantic.info },
        ],
      },
      '2': { // Dominant Trait
        currentValue: topTrait ? 
          topTrait.trait.charAt(0).toUpperCase() + topTrait.trait.slice(1) :
          'Analytical',
        subtitle: topTrait ? 
          `${Math.round(topTrait.score * 100)}% expression level` : 
          'Logical, methodical thinking',
        color: 'love' as const,
        insights: [], // No fake insights - use real UBPM data only
        subMetrics: [
          { name: 'Expression Level', value: topTrait ? `${Math.round(topTrait.score * 100)}%` : '78%', change: '+3%', color: designTokens.semantic.success },
          { name: 'Trait Confidence', value: topTrait ? `${Math.round(topTrait.confidence * 100)}%` : '45%', change: '+2%', color: designTokens.semantic.info },
          { name: 'Consistency', value: topTrait ? 'High' : 'Developing', change: 'Stable', color: designTokens.semantic.success },
          { name: 'Behavioral Impact', value: '89%', change: '+1%', color: designTokens.semantic.success },
        ],
      },
      '3': { // Communication Pattern
        currentValue: behavioralPatterns.length > 0 ? 
          getArchetypeName(behavioralPatterns[0]) :
          'Detail-Oriented',
        subtitle: behavioralPatterns.length > 0 ? 
          'Primary interaction style' : 
          'Comprehensive explanations',
        color: 'info' as const,
        insights: [], // No fake insights - use real UBPM data only
        subMetrics: [
          { name: 'Pattern Strength', value: behavioralPatterns.length > 0 ? '91%' : '67%', change: '+4%', color: designTokens.semantic.success },
          { name: 'Message Depth', value: 'High', change: 'Stable', color: designTokens.semantic.info },
          { name: 'Engagement Level', value: '94%', change: '+2%', color: designTokens.semantic.success },
          { name: 'Clarity Score', value: '88%', change: '+1%', color: designTokens.semantic.info },
        ],
      },
      '4': { // Profile Maturity
        currentValue: ubpmData.dataQuality?.completeness ? 
          `${Math.round(ubpmData.dataQuality.completeness * 100)}%` :
          `${Math.round((ubpmData.confidence || 0) * 100)}%`,
        subtitle: ubpmData.dataQuality?.completeness ? 
          'Cognitive model completion' : 
          'Intelligence gathering progress',
        color: 'wisdom' as const,
        insights: [], // No fake insights - use real UBPM data only
        subMetrics: [
          { name: 'Completion', value: `${Math.round((ubpmData.confidence || 0) * 100)}%`, change: '+5%', color: designTokens.semantic.success },
          { name: 'Data Quality', value: '92%', change: '+2%', color: designTokens.semantic.success },
          { name: 'Pattern Diversity', value: `${behavioralPatterns.length + personalityTraits.length}`, change: '+1', color: designTokens.semantic.info },
          { name: 'Confidence', value: `${Math.round((ubpmData.confidence || 0) * 100)}%`, change: '+3%', color: designTokens.semantic.success },
        ],
      },
    };

    const data = realData[id as keyof typeof realData] || realData['1'];
    
    return {
      id,
      title,
      currentValue: data.currentValue,
      subtitle: data.subtitle,
      color: data.color,
      trend: 'up',
      historicalData: generateCognitiveHistoricalData(id),
      insights: data.insights,
      subMetrics: data.subMetrics,
    };
  };

  // Generate cognitive detail data based on card type (fallback)
  const getCognitiveDetailData = (id: string, title: string): EngineDetailData => {
    const cognitiveData = {
      '1': { // Cognitive Archetype
        currentValue: 'Systematic Analyzer',
        subtitle: 'Evidence-based thinking pattern',
        color: 'success' as const,
        insights: [], // No fake insights - use real UBPM data only
        subMetrics: [
          { name: 'Pattern Confidence', value: '87%', change: '+5%', color: designTokens.semantic.success },
          { name: 'Consistency Score', value: '92%', change: '+2%', color: designTokens.semantic.success },
          { name: 'Analytical Depth', value: 'High', change: 'Stable', color: designTokens.semantic.info },
          { name: 'Decision Style', value: 'Deliberate', change: 'Growing', color: designTokens.semantic.success },
        ],
      },
      '2': { // Dominant Trait
        currentValue: 'Analytical',
        subtitle: 'Primary personality dimension',
        color: 'love' as const,
        insights: [], // No fake insights - use real UBPM data only
        subMetrics: [
          { name: 'Expression Level', value: '85%', change: '+3%', color: designTokens.semantic.success },
          { name: 'Trait Stability', value: '91%', change: '+1%', color: designTokens.semantic.success },
          { name: 'Behavioral Match', value: '88%', change: '+4%', color: designTokens.semantic.info },
          { name: 'Growth Potential', value: 'High', change: 'Expanding', color: designTokens.semantic.success },
        ],
      },
      '3': { // Communication Pattern
        currentValue: 'Detail-Oriented',
        subtitle: 'Comprehensive interaction style',
        color: 'info' as const,
        insights: [], // No fake insights - use real UBPM data only
        subMetrics: [
          { name: 'Message Length', value: '180 chars', change: '+12', color: designTokens.semantic.info },
          { name: 'Context Provision', value: '94%', change: '+3%', color: designTokens.semantic.success },
          { name: 'Question Depth', value: 'High', change: 'Stable', color: designTokens.semantic.success },
          { name: 'Clarity Score', value: '89%', change: '+2%', color: designTokens.semantic.info },
        ],
      },
      '4': { // Profile Maturity
        currentValue: '73%',
        subtitle: 'Cognitive model completion',
        color: 'wisdom' as const,
        insights: [], // No fake insights - use real UBPM data only
        subMetrics: [
          { name: 'Data Points', value: '342', change: '+23', color: designTokens.semantic.success },
          { name: 'Model Accuracy', value: '91%', change: '+4%', color: designTokens.semantic.success },
          { name: 'Pattern Diversity', value: '8 types', change: '+2', color: designTokens.semantic.info },
          { name: 'Confidence Level', value: '87%', change: '+1%', color: designTokens.semantic.success },
        ],
      },
    };

    const data = cognitiveData[id as keyof typeof cognitiveData] || cognitiveData['1'];
    
    return {
      id,
      title,
      currentValue: data.currentValue,
      subtitle: data.subtitle,
      color: data.color,
      trend: 'up',
      historicalData: generateMockHistoricalData(),
      insights: data.insights,
      subMetrics: data.subMetrics,
    };
  };

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
      // Get real UBPM data first to match main screen
      const ubpmResponse = await AnalyticsAPI.getUBPMContext();
      
      let cognitiveDetailData: EngineDetailData;
      
      if (ubpmResponse?.success && ubpmResponse.data) {
        // Use real data to generate detail screen that matches main screen
        cognitiveDetailData = getCognitiveDetailDataFromUBPM(engineId, engineTitle, ubpmResponse.data);
        setUbpmData(ubpmResponse); // Set the real UBPM data for use in JSX
      } else {
        // Fallback to static data
        cognitiveDetailData = getCognitiveDetailData(engineId, engineTitle);
        setUbpmData(null);
      }
      
      setEngineData(cognitiveDetailData);
      
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

  const generateCognitiveHistoricalData = (cardId: string) => {
    const data = [];
    const now = new Date();
    
    // Generate different patterns based on card type
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      let value;
      
      switch (cardId) {
        case '1': // Cognitive Archetype - gradual pattern recognition
          value = Math.min(95, 30 + (23 - i) * 2.5 + (Math.random() - 0.5) * 8);
          break;
        case '2': // Dominant Trait - personality stability
          value = Math.min(90, 50 + (Math.sin((23 - i) * 0.2) * 15) + (Math.random() - 0.5) * 5);
          break;
        case '3': // Communication Pattern - consistent improvement
          value = Math.min(92, 40 + (23 - i) * 2 + (Math.random() - 0.5) * 6);
          break;
        case '4': // Profile Maturity - steady growth
          value = Math.min(85, 20 + (23 - i) * 2.8 + (Math.random() - 0.5) * 4);
          break;
        default:
          value = 75 + (Math.sin(i * 0.3) * 20) + (Math.random() - 0.5) * 10;
      }
      
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.max(20, Math.round(value)),
      });
    }
    return data;
  };

  const generateMockHistoricalData = () => {
    return generateCognitiveHistoricalData('1');
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
          {/* Real Header Summary - Matches Engine Screen Data */}
          <Animated.View 
            style={[
              styles.headerCard,
              createNeumorphicContainer(theme, 'elevated'),
              { opacity: animationValues[0] }
            ]}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {engineTitle}
              </Text>
              {ubpmData ? (
                <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
                  {/* Match exact subtitle from Engine screen */}
                  {engineId === '1' && ubpmData.visualizations?.communicationStats?.style ? 
                    `${ubpmData.visualizations.communicationStats.confidence || 75}% confidence from ${ubpmData.dataPoints} patterns` :
                  engineId === '2' && ubpmData.visualizations?.personalityRadar?.length > 0 ?
                    `${ubpmData.visualizations.personalityRadar[0].score}% strength, ${ubpmData.visualizations.personalityRadar[0].confidence}% confidence` :
                  engineId === '3' && ubpmData.visualizations?.communicationStats?.style ?
                    `${ubpmData.visualizations.communicationStats.avgResponseLength || 150} avg chars • ${ubpmData.visualizations.communicationStats.technicalTerms?.length || 0} tech terms` :
                  engineId === '4' && ubpmData.visualizations?.workPatterns ?
                    `${ubpmData.visualizations.workPatterns.sessionLength}min avg • ${ubpmData.visualizations.workPatterns.messagesPerSession} msg/session • ${ubpmData.visualizations.workPatterns.intensity}% intensity` :
                  'Building profile from real behavioral data'}
                </Text>
              ) : (
                <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
                  Start chatting to build your cognitive profile
                </Text>
              )}
            </View>
            <View style={styles.headerValue}>
              <Text style={[
                styles.headerValueText, 
                { color: designTokens.semantic[engineData.color] }
              ]}>
                {/* Match exact value from Engine screen */}
                {ubpmData ? (
                  engineId === '1' && ubpmData.visualizations?.communicationStats?.style ? 
                    ubpmData.visualizations.communicationStats.style.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') :
                  engineId === '2' && ubpmData.visualizations?.personalityRadar?.length > 0 ?
                    ubpmData.visualizations.personalityRadar[0].trait.charAt(0).toUpperCase() + ubpmData.visualizations.personalityRadar[0].trait.slice(1) :
                  engineId === '3' && ubpmData.visualizations?.communicationStats?.style ?
                    `${ubpmData.visualizations.communicationStats.questionStyle || 'Methodical'} ${ubpmData.visualizations.communicationStats.style}` :
                  engineId === '4' && ubpmData.visualizations?.workPatterns ?
                    `Peak: ${ubpmData.visualizations.workPatterns.preferredHours?.[0] ? 
                      (ubpmData.visualizations.workPatterns.preferredHours[0] === 0 ? '12 AM' : 
                       ubpmData.visualizations.workPatterns.preferredHours[0] === 12 ? '12 PM' : 
                       ubpmData.visualizations.workPatterns.preferredHours[0] < 12 ? `${ubpmData.visualizations.workPatterns.preferredHours[0]} AM` : 
                       `${ubpmData.visualizations.workPatterns.preferredHours[0] - 12} PM`) : '...'}-${ubpmData.visualizations.workPatterns.preferredHours?.[ubpmData.visualizations.workPatterns.preferredHours.length-1] ? 
                      (ubpmData.visualizations.workPatterns.preferredHours[ubpmData.visualizations.workPatterns.preferredHours.length-1] === 0 ? '12 AM' : 
                       ubpmData.visualizations.workPatterns.preferredHours[ubpmData.visualizations.workPatterns.preferredHours.length-1] === 12 ? '12 PM' : 
                       ubpmData.visualizations.workPatterns.preferredHours[ubpmData.visualizations.workPatterns.preferredHours.length-1] < 12 ? `${ubpmData.visualizations.workPatterns.preferredHours[ubpmData.visualizations.workPatterns.preferredHours.length-1]} AM` : 
                       `${ubpmData.visualizations.workPatterns.preferredHours[ubpmData.visualizations.workPatterns.preferredHours.length-1] - 12} PM`) : '...'}` :
                  'Discovering...'
                ) : 'Building Profile...'}
              </Text>
              {ubpmData && (
                <Text style={[
                  styles.trendIndicator,
                  { color: designTokens.semantic.success }
                ]}>
                  ↗
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Real UBPM Data Section */}
          {ubpmData && (
            <Animated.View style={{ opacity: animationValues[1] }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Behavioral Analysis
              </Text>
              <View style={[styles.realDataContainer, createNeumorphicContainer(theme, 'elevated')]}>
                {/* Show real personality traits if available */}
                {ubpmData.visualizations?.personalityRadar?.length > 0 && (
                  <View style={styles.realDataSection}>
                    <Text style={[styles.realDataTitle, { color: colors.text }]}>
                      Personality Profile
                    </Text>
                    {ubpmData.visualizations.personalityRadar.slice(0, 3).map((trait: any, index: number) => (
                      <View key={index} style={styles.traitItem}>
                        <Text style={[styles.traitName, { color: colors.text }]}>
                          {trait.trait.charAt(0).toUpperCase() + trait.trait.slice(1)}
                        </Text>
                        <Text style={[styles.traitScore, { color: designTokens.semantic[engineData.color] }]}>
                          {trait.score}% strength
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Show real communication stats if available */}
                {ubpmData.visualizations?.communicationStats && (
                  <View style={styles.realDataSection}>
                    <Text style={[styles.realDataTitle, { color: colors.text }]}>
                      Communication Style
                    </Text>
                    <View style={styles.commStatsGrid}>
                      <View style={styles.commStatItem}>
                        <Text style={[styles.commStatLabel, { color: colors.textMuted }]}>
                          Style
                        </Text>
                        <Text style={[styles.commStatValue, { color: colors.text }]}>
                          {ubpmData.visualizations.communicationStats.style || 'Analyzing...'}
                        </Text>
                      </View>
                      <View style={styles.commStatItem}>
                        <Text style={[styles.commStatLabel, { color: colors.textMuted }]}>
                          Avg Length
                        </Text>
                        <Text style={[styles.commStatValue, { color: colors.text }]}>
                          {ubpmData.visualizations.communicationStats.avgResponseLength || 150} chars
                        </Text>
                      </View>
                      <View style={styles.commStatItem}>
                        <Text style={[styles.commStatLabel, { color: colors.textMuted }]}>
                          Confidence
                        </Text>
                        <Text style={[styles.commStatValue, { color: colors.text }]}>
                          {ubpmData.visualizations.communicationStats.confidence || 75}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Show work patterns if available */}
                {ubpmData.visualizations?.workPatterns && (
                  <View style={styles.realDataSection}>
                    <Text style={[styles.realDataTitle, { color: colors.text }]}>
                      Activity Patterns
                    </Text>
                    <View style={styles.workPatternsGrid}>
                      <View style={styles.workPatternItem}>
                        <Text style={[styles.workPatternLabel, { color: colors.textMuted }]}>
                          Peak Hours
                        </Text>
                        <Text style={[styles.workPatternValue, { color: colors.text }]}>
                          {ubpmData.visualizations.workPatterns.preferredHours?.map((h: number) => 
                            h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`
                          ).join(', ') || 'Detecting...'}
                        </Text>
                      </View>
                      <View style={styles.workPatternItem}>
                        <Text style={[styles.workPatternLabel, { color: colors.textMuted }]}>
                          Session Length
                        </Text>
                        <Text style={[styles.workPatternValue, { color: colors.text }]}>
                          {ubpmData.visualizations.workPatterns.sessionLength || 0} min avg
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Real Insights Section - Only show if we have actual behavioral data */}
          {ubpmData?.data?.dataPoints > 0 && ubpmData.visualizations?.behaviorFlow?.length > 0 && (
            <Animated.View style={{ opacity: animationValues[4] }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Behavioral Insights
              </Text>
              <View style={[styles.insightsContainer, createNeumorphicContainer(theme, 'elevated')]}>
                {ubpmData.visualizations.behaviorFlow.slice(0, 3).map((pattern: any, index: number) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={[styles.insightDot, { backgroundColor: designTokens.semantic[engineData.color] }]} />
                    <Text style={[styles.insightText, { color: colors.text }]}>
                      {pattern.metadata?.keyInsights?.[0] || `${pattern.pattern} pattern detected with ${pattern.confidence}% confidence`}
                    </Text>
                  </View>
                ))}
                
                {/* Show data quality insight */}
                {ubpmData.data.dataQuality?.completeness && (
                  <View style={styles.insightItem}>
                    <View style={[styles.insightDot, { backgroundColor: designTokens.semantic.success }]} />
                    <Text style={[styles.insightText, { color: colors.text }]}>
                      Profile is {Math.round(ubpmData.data.dataQuality.completeness * 100)}% complete based on {ubpmData.data.dataPoints} interactions
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Empty state for new users with no interactions */}
          {(!ubpmData?.data?.dataPoints || ubpmData.data.dataPoints === 0) && (
            <Animated.View style={{ opacity: animationValues[4] }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Behavioral Insights
              </Text>
              <View style={[styles.insightsContainer, createNeumorphicContainer(theme, 'elevated')]}>
                <View style={styles.emptyInsightsContainer}>
                  <Text style={[styles.emptyInsightsText, { color: colors.textMuted }]}>
                    No behavioral insights yet
                  </Text>
                  <Text style={[styles.emptyInsightsSubtext, { color: colors.textMuted }]}>
                    Start conversations to generate real insights about your thinking patterns
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

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

  // Real UBPM Data Styles
  realDataContainer: {
    padding: spacing[4],
    borderRadius: 16,
  },
  realDataSection: {
    marginBottom: spacing[4],
  },
  realDataTitle: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  traitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  traitName: {
    ...typography.textStyles.body,
    fontWeight: '500',
  },
  traitScore: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
  },
  commStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  commStatLabel: {
    ...typography.textStyles.caption,
    marginBottom: spacing[1],
  },
  commStatValue: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  workPatternsGrid: {
    gap: spacing[3],
  },
  workPatternItem: {
    paddingVertical: spacing[2],
  },
  workPatternLabel: {
    ...typography.textStyles.caption,
    marginBottom: spacing[1],
  },
  workPatternValue: {
    ...typography.textStyles.body,
    fontWeight: '500',
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
    textAlign: 'center',
  },
  emptyInsightsSubtext: {
    ...typography.textStyles.caption,
    textAlign: 'center',
    maxWidth: 250,
  },
});

export default EngineDetailScreen;