/**
 * Test for MetricsTracker service - Core functionality
 */

import { metricsTracker } from '../services/metricsTracker';

describe('MetricsTracker - Core Functionality', () => {
  beforeEach(() => {
    metricsTracker.clearMetrics();
  });

  describe('Basic Tracking', () => {
    it('should track user journey steps', () => {
      metricsTracker.trackJourneyStep('app_start', 'Global');
      metricsTracker.trackJourneyStep('user_signup', 'Auth');
      metricsTracker.trackJourneyStep('first_message', 'Chat');

      const journeySteps = metricsTracker.getJourneySteps();
      
      expect(journeySteps).toHaveLength(3);
      expect(journeySteps[0].step).toBe('app_start');
      expect(journeySteps[1].step).toBe('user_signup');
      expect(journeySteps[2].step).toBe('first_message');
    });

    it('should track events with timestamps', () => {
      const beforeTime = Date.now();
      
      metricsTracker.trackEvent('button_clicked', 'SignUp', { buttonId: 'create-account' });
      
      const afterTime = Date.now();
      const events = metricsTracker.getEvents();
      
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('button_clicked');
      expect(events[0].screen).toBe('SignUp');
      expect(events[0].data?.buttonId).toBe('create-account');
      expect(events[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(events[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should calculate time between journey steps', () => {
      metricsTracker.trackJourneyStep('step1', 'Test');
      
      // Simulate some time passing
      const delay = 100;
      setTimeout(() => {
        metricsTracker.trackJourneyStep('step2', 'Test');
        
        const journeySteps = metricsTracker.getJourneySteps();
        expect(journeySteps).toHaveLength(2);
        expect(journeySteps[1].timeFromPrevious).toBeGreaterThan(0);
      }, delay);

      // Advance timers for test
      jest.advanceTimersByTime(delay + 10);
    });
  });

  describe('Chokepoint Tracking', () => {
    it('should track chokepoint success and failure', () => {
      // Track successful attempts
      metricsTracker.trackChokePointAttempt('message_sending', true, 1500);
      metricsTracker.trackChokePointAttempt('message_sending', true, 2000);
      
      // Track failed attempt
      metricsTracker.trackChokePointAttempt('message_sending', false, 5000, 'Network timeout');

      const chokepointMetrics = metricsTracker.getChokepointMetrics('message_sending');
      
      expect(chokepointMetrics).toBeDefined();
      expect(chokepointMetrics?.totalAttempts).toBe(3);
      expect(chokepointMetrics?.successRate).toBeCloseTo(0.67, 2); // 2/3 success rate
      expect(chokepointMetrics?.averageTime).toBeCloseTo(2833, 0); // (1500+2000+5000)/3
      expect(chokepointMetrics?.failureReasons).toContain('Network timeout');
    });

    it('should track all predefined chokepoints', () => {
      const expectedChokepoints = [
        'app_initialization',
        'signin_form_submission', 
        'message_sending',
        'ai_response_generation',
        'connections_loading'
      ];

      expectedChokepoints.forEach(chokepoint => {
        metricsTracker.trackChokePointAttempt(chokepoint, true, 1000);
      });

      const allChokepoints = metricsTracker.getChokepointMetrics() as Map<string, any>;
      
      expectedChokepoints.forEach(chokepoint => {
        expect(allChokepoints.has(chokepoint)).toBe(true);
        expect(allChokepoints.get(chokepoint)?.totalAttempts).toBe(1);
      });
    });
  });

  describe('User Journey Analysis', () => {
    it('should provide comprehensive journey analysis', () => {
      // Simulate a user journey
      metricsTracker.trackJourneyStep('app_start', 'Global');
      metricsTracker.trackJourneyStep('signup_form_opened', 'Auth');
      metricsTracker.trackJourneyStep('signup_completed', 'Auth');
      metricsTracker.trackJourneyStep('first_chat_opened', 'Chat');
      
      const analysis = metricsTracker.getJourneyAnalysis();
      
      expect(analysis.totalSteps).toBe(4);
      expect(analysis.sessionDuration).toBeGreaterThanOrEqual(0);
      expect(analysis.averageStepTime).toBeGreaterThanOrEqual(0);
      expect(analysis.commonPaths).toBeDefined();
      expect(analysis.dropoffPoints).toBeDefined();
      expect(analysis.chokepointPerformance).toBeDefined();
    });

    it('should identify common user paths', () => {
      // Simulate multiple users following similar paths
      for (let user = 0; user < 3; user++) {
        metricsTracker.trackJourneyStep('app_start', 'Global');
        metricsTracker.trackJourneyStep('signup_form', 'Auth');
        metricsTracker.trackJourneyStep('chat_screen', 'Chat');
      }

      const analysis = metricsTracker.getJourneyAnalysis();
      
      expect(analysis.commonPaths).toContain('app_start->signup_form');
      expect(analysis.commonPaths).toContain('signup_form->chat_screen');
    });
  });

  describe('Conversion Tracking', () => {
    it('should track conversion events', () => {
      metricsTracker.trackConversion('signup_complete', 'Auth', { 
        email: 'test@example.com',
        source: 'organic'
      });

      const conversionEvents = metricsTracker.getEvents('conversion_signup_complete');
      
      expect(conversionEvents).toHaveLength(1);
      expect(conversionEvents[0].data?.email).toBe('test@example.com');
      expect(conversionEvents[0].data?.source).toBe('organic');
      expect(conversionEvents[0].data?.conversionTime).toBeGreaterThanOrEqual(0);
    });

    it('should track user satisfaction ratings', () => {
      metricsTracker.trackUserSatisfaction('Chat', 4.5, 'Great AI responses!');
      metricsTracker.trackUserSatisfaction('Insights', 3.8, 'Interesting but could be clearer');

      const satisfactionEvents = metricsTracker.getEvents('user_satisfaction');
      
      expect(satisfactionEvents).toHaveLength(2);
      
      const chatSatisfaction = satisfactionEvents.find(e => e.screen === 'Chat');
      expect(chatSatisfaction?.data?.rating).toBe(4.5);
      expect(chatSatisfaction?.data?.feedback).toBe('Great AI responses!');
      
      const insightsSatisfaction = satisfactionEvents.find(e => e.screen === 'Insights');
      expect(insightsSatisfaction?.data?.rating).toBe(3.8);
    });
  });

  describe('Error Tracking', () => {
    it('should track and categorize errors', () => {
      metricsTracker.trackError('Network timeout', 'Chat', { 
        endpoint: '/api/chat',
        responseTime: 30000 
      });
      
      metricsTracker.trackError('Invalid auth token', 'Global', { 
        tokenExpiry: Date.now() - 3600000 
      });

      const errorEvents = metricsTracker.getEvents('error');
      
      expect(errorEvents).toHaveLength(2);
      
      const networkError = errorEvents.find(e => 
        e.data?.error === 'Network timeout'
      );
      expect(networkError?.data?.severity).toBe('medium');
      expect(networkError?.data?.context?.endpoint).toBe('/api/chat');
      
      const authError = errorEvents.find(e => 
        e.data?.error === 'Invalid auth token'
      );
      expect(authError?.data?.severity).toBe('high');
    });
  });

  describe('Session Management', () => {
    it('should generate session IDs with proper format', () => {
      const metrics = metricsTracker.exportMetrics();
      
      expect(metrics.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(metrics.sessionId).toBeDefined();
      expect(typeof metrics.sessionId).toBe('string');
    });

    it('should export comprehensive metrics', () => {
      metricsTracker.setUserId('test-user-123');
      metricsTracker.trackJourneyStep('test_step', 'Test');
      metricsTracker.trackEvent('test_event', 'Test');
      metricsTracker.trackChokePointAttempt('app_initialization', true, 1000);

      const exportedMetrics = metricsTracker.exportMetrics();
      
      expect(exportedMetrics.sessionId).toBeDefined();
      expect(exportedMetrics.userId).toBe('test-user-123');
      expect(exportedMetrics.sessionDuration).toBeGreaterThanOrEqual(0);
      expect(exportedMetrics.events.length).toBeGreaterThanOrEqual(2); // journey step + event + others
      expect(exportedMetrics.journeySteps).toHaveLength(1);
      expect(exportedMetrics.chokepoints).toBeDefined();
      expect(exportedMetrics.analysis).toBeDefined();
    });
  });
});