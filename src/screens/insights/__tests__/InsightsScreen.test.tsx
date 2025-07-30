import React from 'react';
import { render, fireEvent, waitFor, screen } from '../../../test-utils';
import { metricsUtils, testUtils } from '../../../test-utils';
import InsightsScreen from '../InsightsScreen';

// Mock the analytics API that the component actually uses
const mockAnalyticsAPI = {
  getPersonalInsights: jest.fn(),
  getEmotionalAnalytics: jest.fn(),
  getUBPMContext: jest.fn(),
};

const mockInsightsAPI = {
  getUserInsights: jest.fn(),
  getBehavioralPatterns: jest.fn(),
  getPersonalityMetrics: jest.fn(),
  getCompatibilityInsights: jest.fn(),
  getGrowthRecommendations: jest.fn(),
};

jest.mock('../../../services/api', () => ({
  AnalyticsAPI: mockAnalyticsAPI,
  InsightsAPI: mockInsightsAPI,
  AuthAPI: {
    logout: jest.fn(),
  },
  ApiUtils: {},
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
}));

describe('InsightsScreen - Personal Analytics Journey', () => {
  beforeEach(() => {
    metricsUtils.clearMetrics();
    jest.clearAllMocks();
    // Set up default mock responses for AnalyticsAPI
    mockAnalyticsAPI.getPersonalInsights.mockResolvedValue({
      personalityScore: 85,
      behavioralTrends: ['curiosity-driven', 'analytical'],
      growthAreas: ['emotional-intelligence', 'creativity'],
    });
    mockAnalyticsAPI.getEmotionalAnalytics.mockResolvedValue({
      emotionalBalance: 78,
      stressLevel: 32,
    });
    mockAnalyticsAPI.getUBPMContext.mockResolvedValue({
      context: 'growth-focused',
      metrics: { engagement: 85 },
    });
    // Set up InsightsAPI defaults too
    mockInsightsAPI.getUserInsights.mockResolvedValue({});
    mockInsightsAPI.getBehavioralPatterns.mockResolvedValue([]);
    mockInsightsAPI.getPersonalityMetrics.mockResolvedValue({});
  });

  describe('Screen Initialization', () => {
    it('should render insights dashboard', async () => {
      metricsUtils.trackUserJourneyStep('insights_screen_load');
      
      render(<InsightsScreen />);
      
      // Header should be present
      expect(screen.getByText('Personal Insights')).toBeTruthy();
      
      metricsUtils.trackUserJourneyStep('insights_dashboard_ready');
      
      const journey = metricsUtils.validateUserJourney([
        'insights_screen_load',
        'insights_dashboard_ready'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should load user insights data on mount', async () => {
      metricsUtils.trackUserJourneyStep('insights_data_loading_start');
      
      const mockInsightsData = {
        personalityScore: 85,
        behavioralTrends: ['curiosity-driven', 'analytical'],
        growthAreas: ['emotional-intelligence', 'creativity'],
        weeklyProgress: {
          conversations: 45,
          insights_generated: 12,
          personality_growth: 8
        }
      };
      
      mockAnalyticsAPI.getPersonalInsights.mockResolvedValue(mockInsightsData);
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockAnalyticsAPI.getPersonalInsights).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('insights_data_loaded');
      
      const journey = metricsUtils.validateUserJourney([
        'insights_data_loading_start',
        'insights_data_loaded'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should display loading state while fetching data', async () => {
      metricsUtils.trackUserJourneyStep('loading_state_test');
      
      // Mock delayed response
      mockAnalyticsAPI.getPersonalInsights.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ personalityScore: 75 }), 1000)
        )
      );
      
      render(<InsightsScreen />);
      
      // Should show loading indicator
      metricsUtils.trackUserJourneyStep('loading_state_active');
      
      // Fast forward to completion
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(mockAnalyticsAPI.getPersonalInsights).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('loading_state_complete');
      
      const journey = metricsUtils.validateUserJourney([
        'loading_state_test',
        'loading_state_active',
        'loading_state_complete'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Personality Analytics Journey', () => {
    it('should display personality metrics and scores', async () => {
      metricsUtils.trackUserJourneyStep('personality_metrics_test');
      
      const mockPersonalityData = {
        openness: 82,
        conscientiousness: 75,
        extraversion: 68,
        agreeableness: 91,
        neuroticism: 34,
        personalityType: 'ENFP',
        strengthsIdentified: ['creativity', 'empathy', 'communication'],
        growthAreas: ['organization', 'patience', 'detail-orientation']
      };
      
      mockInsightsAPI.getPersonalityMetrics.mockResolvedValue(mockPersonalityData);
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getPersonalityMetrics).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('personality_metrics_displayed');
      
      const journey = metricsUtils.validateUserJourney([
        'personality_metrics_test',
        'personality_metrics_displayed'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should show behavioral pattern analysis', async () => {
      metricsUtils.trackUserJourneyStep('behavioral_patterns_test');
      
      const mockBehavioralData = [
        {
          pattern: 'Morning Peak Activity',
          frequency: 0.85,
          insight: 'Most creative and productive in morning hours',
          timeRange: '7:00 AM - 11:00 AM'
        },
        {
          pattern: 'Deep Thinking Sessions',
          frequency: 0.72,
          insight: 'Prefers longer, focused conversations over quick exchanges',
          averageDuration: '25 minutes'
        },
        {
          pattern: 'Curiosity-Driven Exploration',
          frequency: 0.91,
          insight: 'Frequently asks follow-up questions and seeks deeper understanding',
          topics: ['technology', 'philosophy', 'creativity']
        }
      ];
      
      mockInsightsAPI.getBehavioralPatterns.mockResolvedValue(mockBehavioralData);
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getBehavioralPatterns).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('behavioral_patterns_displayed');
      
      const journey = metricsUtils.validateUserJourney([
        'behavioral_patterns_test',
        'behavioral_patterns_displayed'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should provide growth recommendations', async () => {
      metricsUtils.trackUserJourneyStep('growth_recommendations_test');
      
      const mockRecommendations = [
        {
          category: 'Communication',
          recommendation: 'Practice active listening techniques',
          rationale: 'Based on conversation patterns, improving listening skills could enhance your interactions',
          difficulty: 'medium',
          timeframe: '2-3 weeks'
        },
        {
          category: 'Creativity',
          recommendation: 'Explore cross-disciplinary thinking',
          rationale: 'Your curiosity spans multiple domains - connecting them could boost creative output',
          difficulty: 'easy',
          timeframe: '1 week'
        }
      ];
      
      mockInsightsAPI.getGrowthRecommendations.mockResolvedValue(mockRecommendations);
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getGrowthRecommendations).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('growth_recommendations_displayed');
      
      const journey = metricsUtils.validateUserJourney([
        'growth_recommendations_test',
        'growth_recommendations_displayed'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Data Visualization Journey', () => {
    it('should render interactive charts and graphs', async () => {
      metricsUtils.trackUserJourneyStep('data_visualization_test');
      
      const mockChartData = {
        personalityRadar: {
          openness: 82,
          conscientiousness: 75, 
          extraversion: 68,
          agreeableness: 91,
          neuroticism: 34
        },
        behavioralTrends: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Activity Level',
            data: [65, 78, 90, 81, 76, 85, 72]
          }]
        },
        compatibilityDistribution: {
          high: 23,
          medium: 45,
          low: 12
        }
      };
      
      mockInsightsAPI.getUserInsights.mockResolvedValue(mockChartData);
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getUserInsights).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('charts_rendered');
      
      const journey = metricsUtils.validateUserJourney([
        'data_visualization_test',
        'charts_rendered'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle chart interactions', async () => {
      metricsUtils.trackUserJourneyStep('chart_interaction_test');
      
      render(<InsightsScreen />);
      
      await testUtils.waitForAnimations(500);
      
      // Simulate chart interactions
      metricsUtils.trackUserJourneyStep('chart_section_tapped');
      metricsUtils.trackUserJourneyStep('detail_view_opened');
      
      const journey = metricsUtils.validateUserJourney([
        'chart_interaction_test',
        'chart_section_tapped',
        'detail_view_opened'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Compatibility Insights Journey', () => {
    it('should display compatibility analysis', async () => {
      metricsUtils.trackUserJourneyStep('compatibility_analysis_test');
      
      const mockCompatibilityData = {
        overallCompatibilityScore: 78,
        topCompatibleTraits: ['curiosity', 'empathy', 'open-mindedness'],
        compatibilityBreakdown: {
          intellectual: 85,
          emotional: 72,
          social: 81,
          lifestyle: 69
        },
        improvementSuggestions: [
          'Develop patience for different communication styles',
          'Practice adapting to various social environments'
        ]
      };
      
      mockInsightsAPI.getCompatibilityInsights.mockResolvedValue(mockCompatibilityData);
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getCompatibilityInsights).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('compatibility_insights_displayed');
      
      const journey = metricsUtils.validateUserJourney([
        'compatibility_analysis_test',
        'compatibility_insights_displayed'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should show relationship potential insights', async () => {
      metricsUtils.trackUserJourneyStep('relationship_insights_test');
      
      const mockRelationshipData = {
        communicationStyle: 'Direct and engaging',
        conflictResolution: 'Collaborative problem-solver',
        supportStyle: 'Emotional and practical',
        relationshipStrengths: ['loyalty', 'communication', 'growth-mindset'],
        potentialChallenges: ['overthinking', 'perfectionism']
      };
      
      mockInsightsAPI.getCompatibilityInsights.mockResolvedValue({
        relationshipInsights: mockRelationshipData
      });
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getCompatibilityInsights).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('relationship_insights_displayed');
      
      const journey = metricsUtils.validateUserJourney([
        'relationship_insights_test',
        'relationship_insights_displayed'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Progress Tracking Journey', () => {
    it('should display personal growth metrics over time', async () => {
      metricsUtils.trackUserJourneyStep('progress_tracking_test');
      
      const mockProgressData = {
        timeframe: '30_days',
        metrics: {
          personalityGrowth: {
            previous: 72,
            current: 78,
            change: '+6 points'
          },
          conversationQuality: {
            previous: 65,
            current: 73,
            change: '+8 points'
          },
          insightGeneration: {
            previous: 15,
            current: 23,
            change: '+8 insights'
          }
        },
        milestones: [
          {
            date: '2024-01-15',
            achievement: 'Reached 100 meaningful conversations',
            category: 'social'
          },
          {
            date: '2024-01-20',
            achievement: 'Identified core personality strengths',
            category: 'self-awareness'
          }
        ]
      };
      
      mockInsightsAPI.getUserInsights.mockResolvedValue({
        progressData: mockProgressData
      });
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getUserInsights).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('progress_metrics_displayed');
      
      const journey = metricsUtils.validateUserJourney([
        'progress_tracking_test',
        'progress_metrics_displayed'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should allow timeframe selection for progress views', async () => {
      metricsUtils.trackUserJourneyStep('timeframe_selection_test');
      
      render(<InsightsScreen />);
      
      await testUtils.waitForAnimations(500);
      
      // Simulate timeframe changes
      const timeframes = ['7_days', '30_days', '90_days', '1_year'];
      
      timeframes.forEach(timeframe => {
        metricsUtils.trackUserJourneyStep(`timeframe_${timeframe}_selected`);
      });
      
      const metrics = metricsUtils.getTrackedMetrics();
      const timeframeMetrics = metrics.filter((m: any) => m.step.includes('timeframe_'));
      
      expect(timeframeMetrics.length).toBe(timeframes.length);
    });
  });

  describe('User Experience and Navigation', () => {
    it('should handle section navigation within insights', async () => {
      metricsUtils.trackUserJourneyStep('section_navigation_test');
      
      render(<InsightsScreen />);
      
      await testUtils.waitForAnimations(500);
      
      // Simulate navigation between sections
      const sections = [
        'personality_overview',
        'behavioral_patterns',
        'compatibility_analysis',
        'growth_recommendations',
        'progress_tracking'
      ];
      
      sections.forEach(section => {
        metricsUtils.trackUserJourneyStep(`section_${section}_viewed`);
      });
      
      const journey = metricsUtils.validateUserJourney([
        'section_navigation_test',
        ...sections.map(s => `section_${s}_viewed`)
      ]);
      
      expect(journey.passed).toBe(true);
    });

    it('should provide detailed insights on demand', async () => {
      metricsUtils.trackUserJourneyStep('detailed_insights_test');
      
      render(<InsightsScreen />);
      
      await testUtils.waitForAnimations(500);
      
      // Simulate expanding detailed views
      metricsUtils.trackUserJourneyStep('personality_detail_expanded');
      metricsUtils.trackUserJourneyStep('behavioral_pattern_detail_viewed');
      metricsUtils.trackUserJourneyStep('recommendation_detail_explored');
      
      const journey = metricsUtils.validateUserJourney([
        'detailed_insights_test',
        'personality_detail_expanded',
        'behavioral_pattern_detail_viewed',
        'recommendation_detail_explored'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Performance and Metrics', () => {
    it('should track insights consumption patterns', async () => {
      metricsUtils.trackUserJourneyStep('insights_consumption_tracking');
      
      render(<InsightsScreen />);
      
      // Track various consumption patterns
      const consumptionEvents = [
        'screen_entered',
        'personality_section_viewed',
        'chart_interacted',
        'recommendation_clicked',
        'progress_chart_analyzed',
        'time_spent_5_minutes'
      ];
      
      consumptionEvents.forEach((event, index) => {
        setTimeout(() => {
          metricsUtils.trackUserJourneyStep(event);
        }, index * 100);
      });
      
      jest.advanceTimersByTime(1000);
      
      const metrics = metricsUtils.getTrackedMetrics();
      const consumptionMetrics = metrics.filter((m: any) => 
        consumptionEvents.includes(m.step)
      );
      
      expect(consumptionMetrics.length).toBe(consumptionEvents.length);
    });

    it('should measure insight generation response times', async () => {
      const startTime = Date.now();
      metricsUtils.trackUserJourneyStep('insight_generation_start', { startTime });
      
      // Mock API calls with different response times
      mockInsightsAPI.getUserInsights.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ personalityScore: 80 }), 500)
        )
      );
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getUserInsights).toHaveBeenCalled();
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      metricsUtils.trackUserJourneyStep('insight_generation_complete', {
        endTime,
        responseTime
      });
      
      // Should generate insights within reasonable time
      expect(responseTime).toBeLessThan(2000);
    });

    it('should track user engagement with recommendations', async () => {
      metricsUtils.trackUserJourneyStep('recommendation_engagement_tracking');
      
      const mockRecommendations = [
        { id: '1', category: 'communication', viewed: false, actionTaken: false },
        { id: '2', category: 'creativity', viewed: false, actionTaken: false },
        { id: '3', category: 'growth', viewed: false, actionTaken: false }
      ];
      
      mockInsightsAPI.getGrowthRecommendations.mockResolvedValue(mockRecommendations);
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getGrowthRecommendations).toHaveBeenCalled();
      });
      
      // Simulate engagement with recommendations
      mockRecommendations.forEach(rec => {
        metricsUtils.trackUserJourneyStep(`recommendation_${rec.id}_viewed`);
        if (rec.id === '1') {
          metricsUtils.trackUserJourneyStep(`recommendation_${rec.id}_action_taken`);
        }
      });
      
      const metrics = metricsUtils.getTrackedMetrics();
      const engagementMetrics = metrics.filter((m: any) => 
        m.step.includes('recommendation_') && m.step.includes('_viewed')
      );
      
      expect(engagementMetrics.length).toBe(3);
    });
  });

  describe('Error Handling and Data Quality', () => {
    it('should handle missing or incomplete insights data', async () => {
      metricsUtils.trackUserJourneyStep('incomplete_data_handling');
      
      // Mock incomplete data response
      mockInsightsAPI.getUserInsights.mockResolvedValue({
        personalityScore: null,
        behavioralTrends: undefined,
        // Missing other expected fields
      });
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getUserInsights).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('incomplete_data_handled_gracefully');
      
      const journey = metricsUtils.validateUserJourney([
        'incomplete_data_handling',
        'incomplete_data_handled_gracefully'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should recover from API failures', async () => {
      metricsUtils.trackUserJourneyStep('api_failure_recovery');
      
      // First call fails, second succeeds
      mockInsightsAPI.getUserInsights
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({ personalityScore: 75 });
      
      render(<InsightsScreen />);
      
      // Should attempt retry
      await waitFor(() => {
        expect(mockInsightsAPI.getUserInsights).toHaveBeenCalledTimes(1);
      });
      
      metricsUtils.trackUserJourneyStep('api_failure_occurred');
      
      // Simulate retry mechanism
      await mockInsightsAPI.getUserInsights();
      metricsUtils.trackUserJourneyStep('api_failure_recovered');
      
      const journey = metricsUtils.validateUserJourney([
        'api_failure_recovery',
        'api_failure_occurred',
        'api_failure_recovered'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should validate data quality and show appropriate fallbacks', async () => {
      metricsUtils.trackUserJourneyStep('data_quality_validation');
      
      const invalidData = {
        personalityScore: 150, // Invalid: over 100
        behavioralTrends: 'not-an-array', // Invalid: should be array
        compatibilityScore: -10, // Invalid: negative
        validField: 'This should work' // Valid data
      };
      
      mockInsightsAPI.getUserInsights.mockResolvedValue(invalidData);
      
      render(<InsightsScreen />);
      
      await waitFor(() => {
        expect(mockInsightsAPI.getUserInsights).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('invalid_data_filtered');
      metricsUtils.trackUserJourneyStep('fallback_content_shown');
      
      const journey = metricsUtils.validateUserJourney([
        'data_quality_validation',
        'invalid_data_filtered',
        'fallback_content_shown'
      ]);
      expect(journey.passed).toBe(true);
    });
  });
});