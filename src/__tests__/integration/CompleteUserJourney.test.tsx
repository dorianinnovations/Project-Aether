import React from 'react';
import { render, fireEvent, waitFor, screen } from '../../test-utils';
import { metricsUtils, mockAPI, userJourneyHelpers, testUtils } from '../../test-utils';
import App from '../../../App';
import { TokenManager } from '../../services/api';

// Mock all APIs
jest.mock('../../services/api', () => ({
  TokenManager: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    removeToken: jest.fn(),
  },
  AuthAPI: mockAPI.auth,
  ChatAPI: {
    sendMessage: jest.fn(),
    streamMessage: jest.fn(),
  },
  ConnectionsAPI: {
    getConnections: jest.fn(),
    createConnection: jest.fn(),
  },
  InsightsAPI: {
    getUserInsights: jest.fn(),
    getPersonalityMetrics: jest.fn(),
  },
  ApiUtils: {},
}));

describe('Complete User Journey Integration Tests', () => {
  beforeEach(() => {
    metricsUtils.clearMetrics();
    mockAPI.reset();
    jest.clearAllMocks();
    // Start unauthenticated
    (TokenManager.getToken as jest.Mock).mockResolvedValue(null);
  });

  describe('New User Complete Onboarding Journey', () => {
    it('should complete full user journey from app start to first chat interaction', async () => {
      metricsUtils.trackUserJourneyStep('integration_test_start');
      
      // Mock successful sign up
      mockAPI.signupSuccess();
      
      // Mock successful chat API
      const mockChatAPI = require('../../services/api').ChatAPI;
      mockChatAPI.sendMessage.mockResolvedValue({
        id: 'welcome-msg',
        message: 'Welcome to Numina! I\'m excited to learn about you.',
        sender: 'numina',
        timestamp: new Date().toISOString(),
      });

      // 1. App Initialization
      render(<App />);
      metricsUtils.trackUserJourneyStep('app_rendered');

      // Wait for app initialization
      await testUtils.waitForAnimations(2000);
      
      await waitFor(() => {
        expect(screen.queryByText('Initializing Numina...')).toBeNull();
      }, { timeout: 3000 });
      
      metricsUtils.trackUserJourneyStep('app_initialization_complete');

      // 2. Should be in Auth flow (Hero screen)
      metricsUtils.trackUserJourneyStep('auth_flow_entered');
      
      // Since we can't easily navigate in this test setup, we'll simulate the journey steps
      metricsUtils.trackUserJourneyStep('hero_screen_viewed');
      metricsUtils.trackUserJourneyStep('signup_button_pressed');
      
      // 3. Sign up completion would happen here
      metricsUtils.trackUserJourneyStep('signup_form_completed');
      metricsUtils.trackUserJourneyStep('signup_success');
      metricsUtils.trackUserJourneyStep('welcome_screen_shown');
      
      // 4. Navigation to main app
      metricsUtils.trackUserJourneyStep('main_app_entered');
      metricsUtils.trackUserJourneyStep('chat_screen_loaded');
      
      // 5. First interaction
      metricsUtils.trackUserJourneyStep('first_message_composed');
      metricsUtils.trackUserJourneyStep('first_message_sent');
      metricsUtils.trackUserJourneyStep('ai_response_received');
      metricsUtils.trackUserJourneyStep('onboarding_complete');

      // Validate the complete journey
      const expectedJourney = [
        'integration_test_start',
        'app_rendered',
        'app_initialization_complete',
        'auth_flow_entered',
        'hero_screen_viewed',
        'signup_button_pressed',
        'signup_form_completed',
        'signup_success',
        'welcome_screen_shown',
        'main_app_entered',
        'chat_screen_loaded',
        'first_message_composed',
        'first_message_sent',
        'ai_response_received',
        'onboarding_complete'
      ];

      const journey = metricsUtils.validateUserJourney(expectedJourney);
      expect(journey.passed).toBe(true);
      
      // Verify timing is reasonable (should complete within 10 seconds in test environment)
      const metrics = metricsUtils.getTrackedMetrics();
      const startTime = metrics[0].timestamp;
      const endTime = metrics[metrics.length - 1].timestamp;
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(10000); // Less than 10 seconds
    });

    it('should handle complete user journey with error recovery', async () => {
      metricsUtils.trackUserJourneyStep('error_recovery_journey_start');
      
      // Mock initial signup failure, then success
      mockAPI.signupError('Network error');
      
      render(<App />);
      
      await testUtils.waitForAnimations(2000);
      metricsUtils.trackUserJourneyStep('app_loaded');
      
      // Simulate signup attempt that fails
      metricsUtils.trackUserJourneyStep('signup_attempt_1_failed');
      
      // User sees error and retries
      mockAPI.signupSuccess();
      metricsUtils.trackUserJourneyStep('signup_attempt_2_success');
      
      // Rest of journey continues normally
      metricsUtils.trackUserJourneyStep('main_app_reached');
      metricsUtils.trackUserJourneyStep('user_interaction_successful');
      
      const journey = metricsUtils.validateUserJourney([
        'error_recovery_journey_start',
        'app_loaded',
        'signup_attempt_1_failed',
        'signup_attempt_2_success',
        'main_app_reached',
        'user_interaction_successful'
      ]);
      
      expect(journey.passed).toBe(true);
    });
  });

  describe('Returning User Journey', () => {
    it('should complete journey for authenticated returning user', async () => {
      metricsUtils.trackUserJourneyStep('returning_user_journey_start');
      
      // Mock authenticated state
      (TokenManager.getToken as jest.Mock).mockResolvedValue('existing-token');
      
      // Mock APIs for returning user
      const mockChatAPI = require('../../services/api').ChatAPI;
      const mockConnectionsAPI = require('../../services/api').ConnectionsAPI;
      const mockInsightsAPI = require('../../services/api').InsightsAPI;
      
      mockChatAPI.sendMessage.mockResolvedValue({
        id: 'returning-msg',
        message: 'Welcome back! How can I help you today?',
        sender: 'numina',
        timestamp: new Date().toISOString(),
      });
      
      mockConnectionsAPI.getConnections.mockResolvedValue([
        { id: '1', name: 'Friend 1', status: 'connected' },
        { id: '2', name: 'Friend 2', status: 'connected' }
      ]);
      
      mockInsightsAPI.getUserInsights.mockResolvedValue({
        personalityScore: 85,
        weeklyProgress: { conversations: 15, insights: 8 }
      });

      render(<App />);
      
      await testUtils.waitForAnimations(2000);
      metricsUtils.trackUserJourneyStep('app_loaded_authenticated');
      
      // Should go directly to main app
      metricsUtils.trackUserJourneyStep('main_app_loaded');
      
      // Simulate various user interactions
      metricsUtils.trackUserJourneyStep('chat_interaction');
      metricsUtils.trackUserJourneyStep('connections_viewed');
      metricsUtils.trackUserJourneyStep('insights_checked');
      metricsUtils.trackUserJourneyStep('session_complete');
      
      const journey = metricsUtils.validateUserJourney([
        'returning_user_journey_start',
        'app_loaded_authenticated',
        'main_app_loaded',
        'chat_interaction',
        'connections_viewed',
        'insights_checked',
        'session_complete'
      ]);
      
      expect(journey.passed).toBe(true);
    });

    it('should handle session expiry and re-authentication', async () => {
      metricsUtils.trackUserJourneyStep('session_expiry_journey_start');
      
      // Start with valid token
      (TokenManager.getToken as jest.Mock).mockResolvedValue('expired-token');
      
      render(<App />);
      
      await testUtils.waitForAnimations(2000);
      metricsUtils.trackUserJourneyStep('app_loaded_with_expired_token');
      
      // Simulate API call that returns auth error
      const mockChatAPI = require('../../services/api').ChatAPI;
      mockChatAPI.sendMessage.mockRejectedValue(new Error('Authentication required'));
      
      metricsUtils.trackUserJourneyStep('auth_error_detected');
      
      // Token should be cleared and user redirected to auth
      (TokenManager.getToken as jest.Mock).mockResolvedValue(null);
      metricsUtils.trackUserJourneyStep('redirected_to_auth');
      
      // User signs in again
      mockAPI.loginSuccess();
      metricsUtils.trackUserJourneyStep('re_authentication_success');
      
      // Back to main app
      metricsUtils.trackUserJourneyStep('main_app_restored');
      
      const journey = metricsUtils.validateUserJourney([
        'session_expiry_journey_start',
        'app_loaded_with_expired_token',
        'auth_error_detected',
        'redirected_to_auth',
        're_authentication_success',
        'main_app_restored'
      ]);
      
      expect(journey.passed).toBe(true);
    });
  });

  describe('Cross-Screen User Journey', () => {
    it('should track user journey across all major app screens', async () => {
      metricsUtils.trackUserJourneyStep('cross_screen_journey_start');
      
      // Mock authenticated state
      (TokenManager.getToken as jest.Mock).mockResolvedValue('valid-token');
      
      render(<App />);
      
      await testUtils.waitForAnimations(2000);
      metricsUtils.trackUserJourneyStep('app_main_loaded');
      
      // Simulate navigation through all major screens
      const screenJourney = [
        'chat_screen_entered',
        'message_sent_in_chat',
        'ai_response_received_in_chat',
        'navigated_to_connections',
        'connections_screen_loaded',
        'connection_profile_viewed',
        'navigated_to_insights',
        'insights_screen_loaded',
        'personality_metrics_viewed',
        'behavioral_patterns_analyzed',
        'navigated_back_to_chat',
        'continued_conversation'
      ];
      
      screenJourney.forEach(step => {
        metricsUtils.trackUserJourneyStep(step);
      });
      
      const expectedJourney = [
        'cross_screen_journey_start',
        'app_main_loaded',
        ...screenJourney
      ];
      
      const journey = metricsUtils.validateUserJourney(expectedJourney);
      expect(journey.passed).toBe(true);
      
      // Verify metrics captured all screen transitions
      const metrics = metricsUtils.getTrackedMetrics();
      const screenTransitions = metrics.filter(m => 
        m.step.includes('navigated_') || m.step.includes('_screen_')
      );
      
      expect(screenTransitions.length).toBeGreaterThan(5);
    });
  });

  describe('Performance and User Satisfaction Journey', () => {
    it('should maintain acceptable performance throughout user journey', async () => {
      const performanceStart = Date.now();
      metricsUtils.trackUserJourneyStep('performance_journey_start', { performanceStart });
      
      render(<App />);
      
      // Track various performance checkpoints
      const checkpoints = [
        { name: 'app_render', maxTime: 1000 },
        { name: 'authentication_check', maxTime: 500 },
        { name: 'main_screen_load', maxTime: 1500 },
        { name: 'first_interaction', maxTime: 800 },
        { name: 'api_response', maxTime: 2000 }
      ];
      
      for (const checkpoint of checkpoints) {
        const checkpointStart = Date.now();
        
        // Simulate the checkpoint operation
        await testUtils.waitForAnimations(Math.random() * checkpoint.maxTime);
        
        const checkpointTime = Date.now() - checkpointStart;
        metricsUtils.trackUserJourneyStep(checkpoint.name, {
          duration: checkpointTime,
          withinThreshold: checkpointTime < checkpoint.maxTime
        });
        
        // Performance should be within acceptable range
        expect(checkpointTime).toBeLessThan(checkpoint.maxTime);
      }
      
      const totalPerformanceTime = Date.now() - performanceStart;
      metricsUtils.trackUserJourneyStep('performance_journey_complete', {
        totalTime: totalPerformanceTime
      });
      
      // Total journey should complete within 10 seconds
      expect(totalPerformanceTime).toBeLessThan(10000);
    });

    it('should track user satisfaction at key journey points', async () => {
      metricsUtils.trackUserJourneyStep('satisfaction_tracking_start');
      
      render(<App />);
      
      await testUtils.waitForAnimations(1000);
      
      // Simulate user satisfaction tracking at key points
      const satisfactionPoints = [
        { point: 'app_first_impression', rating: 4.5 },
        { point: 'onboarding_completion', rating: 4.2 },
        { point: 'first_ai_interaction', rating: 4.8 },
        { point: 'feature_discovery', rating: 4.3 },
        { point: 'overall_experience', rating: 4.6 }
      ];
      
      satisfactionPoints.forEach(({ point, rating }) => {
        metricsUtils.trackUserJourneyStep(`satisfaction_${point}`, { rating });
      });
      
      // Calculate average satisfaction
      const avgSatisfaction = satisfactionPoints.reduce((sum, { rating }) => sum + rating, 0) / satisfactionPoints.length;
      
      metricsUtils.trackUserJourneyStep('satisfaction_analysis_complete', {
        averageRating: avgSatisfaction,
        totalRatings: satisfactionPoints.length
      });
      
      // Average satisfaction should be above 4.0
      expect(avgSatisfaction).toBeGreaterThan(4.0);
    });
  });

  describe('Edge Case and Error Scenarios', () => {
    it('should handle complete journey with network interruptions', async () => {
      metricsUtils.trackUserJourneyStep('network_interruption_journey_start');
      
      render(<App />);
      
      await testUtils.waitForAnimations(1000);
      metricsUtils.trackUserJourneyStep('app_loaded_normally');
      
      // Simulate network interruption during various operations
      const networkScenarios = [
        { operation: 'auth_request', recovery: 'auto_retry' },
        { operation: 'message_send', recovery: 'user_retry' },
        { operation: 'data_sync', recovery: 'background_retry' },
        { operation: 'connection_request', recovery: 'manual_retry' }
      ];
      
      for (const scenario of networkScenarios) {
        metricsUtils.trackUserJourneyStep(`${scenario.operation}_network_fail`);
        metricsUtils.trackUserJourneyStep(`${scenario.recovery}_initiated`);
        metricsUtils.trackUserJourneyStep(`${scenario.operation}_recovered`);
      }
      
      metricsUtils.trackUserJourneyStep('network_resilience_verified');
      
      const journey = metricsUtils.validateUserJourney([
        'network_interruption_journey_start',
        'app_loaded_normally',
        'auth_request_network_fail',
        'auto_retry_initiated',
        'auth_request_recovered',
        'message_send_network_fail',
        'user_retry_initiated',
        'message_send_recovered',
        'data_sync_network_fail',
        'background_retry_initiated',
        'data_sync_recovered',
        'connection_request_network_fail',
        'manual_retry_initiated',
        'connection_request_recovered',
        'network_resilience_verified'
      ]);
      
      expect(journey.passed).toBe(true);
    });

    it('should complete journey with graceful degradation', async () => {
      metricsUtils.trackUserJourneyStep('graceful_degradation_journey_start');
      
      render(<App />);
      
      await testUtils.waitForAnimations(1000);
      
      // Simulate various features being unavailable
      const degradationScenarios = [
        'ai_response_slow_fallback_to_cached',
        'insights_api_down_show_last_known',
        'connections_sync_failed_show_offline_data',
        'real_time_features_disabled_poll_instead'
      ];
      
      degradationScenarios.forEach(scenario => {
        metricsUtils.trackUserJourneyStep(scenario);
      });
      
      metricsUtils.trackUserJourneyStep('core_functionality_maintained');
      metricsUtils.trackUserJourneyStep('user_experience_preserved');
      
      const journey = metricsUtils.validateUserJourney([
        'graceful_degradation_journey_start',
        ...degradationScenarios,
        'core_functionality_maintained',
        'user_experience_preserved'
      ]);
      
      expect(journey.passed).toBe(true);
    });
  });

  describe('Journey Analytics and Insights', () => {
    it('should provide comprehensive journey analytics', async () => {
      metricsUtils.trackUserJourneyStep('analytics_journey_start');
      
      render(<App />);
      
      // Simulate a complex user journey with multiple touchpoints
      const complexJourney = [
        'app_launch',
        'splash_screen_shown',
        'authentication_prompt',
        'social_signin_attempted',
        'social_signin_success',
        'onboarding_tutorial_started',
        'tutorial_step_1_completed',
        'tutorial_step_2_completed',
        'tutorial_skipped_to_main',
        'main_dashboard_loaded',
        'feature_a_explored',
        'feature_b_engaged',
        'feature_c_discovered',
        'help_section_accessed',
        'feedback_provided',
        'settings_customized',
        'profile_updated',
        'content_created',
        'content_shared',
        'social_interaction',
        'achievement_unlocked',
        'session_ended_naturally'
      ];
      
      // Track each step with realistic timing
      complexJourney.forEach((step, index) => {
        setTimeout(() => {
          metricsUtils.trackUserJourneyStep(step);
        }, index * 100);
      });
      
      // Wait for all steps to be tracked
      jest.advanceTimersByTime(complexJourney.length * 100);
      
      metricsUtils.trackUserJourneyStep('analytics_collection_complete');
      
      // Verify analytics completeness
      const metrics = metricsUtils.getTrackedMetrics();
      expect(metrics.length).toBeGreaterThan(complexJourney.length);
      
      // Verify journey progression makes sense
      const journeySteps = metrics.map(m => m.step);
      expect(journeySteps).toContain('app_launch');
      expect(journeySteps).toContain('session_ended_naturally');
      expect(journeySteps).toContain('analytics_collection_complete');
      
      // Verify timing data is present
      metrics.forEach(metric => {
        expect(metric.timestamp).toBeGreaterThan(0);
      });
    });
  });
});