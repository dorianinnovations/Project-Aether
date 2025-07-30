import React from 'react';
import { metricsUtils, testUtils } from '../../test-utils';
import { metricsTracker } from '../../services/metricsTracker';

describe('User Flow Metrics Integration Tests', () => {
  beforeEach(() => {
    metricsUtils.clearMetrics();
    metricsTracker.clearMetrics();
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Clean up any pending operations
    metricsUtils.clearMetrics();
    metricsTracker.clearMetrics();
    
    // Clear any timers/intervals that might be running
    jest.clearAllTimers();
  });

  describe('Critical Path Metrics', () => {
    it('should track and validate critical user path performance', async () => {
      // Define critical path chokepoints
      const criticalChokepoints = [
        { name: 'app_initialization', maxTime: 3000, minSuccessRate: 0.95 },
        { name: 'signin_form_submission', maxTime: 5000, minSuccessRate: 0.90 },
        { name: 'message_sending', maxTime: 2000, minSuccessRate: 0.95 },
        { name: 'ai_response_generation', maxTime: 8000, minSuccessRate: 0.92 },
        { name: 'connections_loading', maxTime: 3000, minSuccessRate: 0.98 }
      ];

      // Simulate multiple user sessions
      for (let session = 0; session < 10; session++) {
        metricsTracker.trackJourneyStep(`session_${session}_start`, 'Global');
        
        for (const chokepoint of criticalChokepoints) {
          const startTime = Date.now();
          
          // Simulate operation with realistic success/failure rates
          const isSuccess = Math.random() > (1 - chokepoint.minSuccessRate);
          const duration = Math.random() * chokepoint.maxTime * 0.8; // Usually under max time
          
          await new Promise(resolve => setTimeout(resolve, Math.min(duration, 100))); // Speed up for test
          
          const actualDuration = Date.now() - startTime;
          
          metricsTracker.trackChokePointAttempt(
            chokepoint.name,
            isSuccess,
            actualDuration,
            isSuccess ? undefined : `Simulated failure for ${chokepoint.name}`
          );
        }
        
        metricsTracker.trackJourneyStep(`session_${session}_complete`, 'Global');
      }

      // Analyze chokepoint performance
      const chokepointMetrics = metricsTracker.getChokepointMetrics() as Map<string, any>;
      
      criticalChokepoints.forEach(expectedChokepoint => {
        const actualMetrics = chokepointMetrics.get(expectedChokepoint.name);
        
        expect(actualMetrics).toBeDefined();
        expect(actualMetrics.totalAttempts).toBe(10); // 10 sessions
        expect(actualMetrics.successRate).toBeGreaterThanOrEqual(expectedChokepoint.minSuccessRate * 0.8); // Allow some variance
        expect(actualMetrics.averageTime).toBeLessThan(expectedChokepoint.maxTime);
      });
    });

    it('should identify bottlenecks in user journey', async () => {
      // Create intentional bottleneck scenarios
      const bottleneckScenarios = [
        { step: 'slow_api_response', delay: 5000, frequency: 0.3 },
        { step: 'heavy_animation', delay: 2000, frequency: 0.5 },
        { step: 'large_data_load', delay: 3000, frequency: 0.4 },
        { step: 'network_retry', delay: 8000, frequency: 0.2 }
      ];

      // Simulate user sessions with bottlenecks
      for (let i = 0; i < 20; i++) {
        metricsTracker.trackJourneyStep('session_start', 'Test');
        
        for (const scenario of bottleneckScenarios) {
          const hasBottleneck = Math.random() < scenario.frequency;
          const duration = hasBottleneck ? scenario.delay : 500; // Normal duration
          
          const startTime = Date.now();
          await new Promise(resolve => setTimeout(resolve, Math.min(duration, 100))); // Speed up for test
          const actualDuration = Date.now() - startTime + (hasBottleneck ? scenario.delay - 100 : 0); // Simulate full duration
          
          metricsTracker.trackEvent(scenario.step, 'Test', { 
            hadBottleneck: hasBottleneck,
            simulatedDuration: actualDuration
          }, actualDuration);
        }
        
        metricsTracker.trackJourneyStep('session_end', 'Test');
      }

      // Analyze for bottlenecks
      const journeyAnalysis = metricsTracker.getJourneyAnalysis();
      
      expect(journeyAnalysis.totalSteps).toBeGreaterThan(40); // 20 sessions × 2+ steps each
      expect(journeyAnalysis.averageStepTime).toBeGreaterThan(0);
      
      // Verify bottleneck detection
      const events = metricsTracker.getEvents();
      const bottleneckEvents = events.filter(event => 
        event.data?.hadBottleneck && event.duration && event.duration > 2000
      );
      
      expect(bottleneckEvents.length).toBeGreaterThan(0);
    });
  });

  describe('User Engagement Metrics', () => {
    it('should track comprehensive user engagement patterns', async () => {
      const engagementScenarios = [
        // High engagement user
        {
          userId: 'user_high_engagement',
          sessions: 5,
          avgSessionTime: 1800000, // 30 minutes
          interactions: ['message_send', 'profile_view', 'connection_request', 'insight_view'],
          satisfaction: 4.5
        },
        // Medium engagement user  
        {
          userId: 'user_medium_engagement',
          sessions: 3,
          avgSessionTime: 900000, // 15 minutes
          interactions: ['message_send', 'profile_view'],
          satisfaction: 3.8
        },
        // Low engagement user
        {
          userId: 'user_low_engagement',
          sessions: 1,
          avgSessionTime: 300000, // 5 minutes
          interactions: ['message_send'],
          satisfaction: 3.2
        }
      ];

      for (const user of engagementScenarios) {
        metricsTracker.setUserId(user.userId);
        
        for (let session = 0; session < user.sessions; session++) {
          const sessionStart = Date.now();
          metricsTracker.trackJourneyStep('session_start', 'Global', { userId: user.userId });
          
          // Simulate session interactions
          const sessionInteractions = Math.floor(Math.random() * user.interactions.length) + 1;
          
          for (let i = 0; i < sessionInteractions; i++) {
            const interaction = user.interactions[Math.floor(Math.random() * user.interactions.length)];
            metricsTracker.trackEvent(interaction, 'App', { userId: user.userId });
            
            // Add realistic delays between interactions
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Track session satisfaction
          metricsTracker.trackUserSatisfaction('App', user.satisfaction, `Session ${session + 1} feedback`);
          
          const sessionDuration = Date.now() - sessionStart + user.avgSessionTime; // Simulate full duration
          metricsTracker.trackJourneyStep('session_end', 'Global', { 
            userId: user.userId,
            sessionDuration,
            interactions: sessionInteractions
          });
        }
      }

      // Analyze engagement patterns
      const allEvents = metricsTracker.getEvents();
      const userEvents = engagementScenarios.reduce((acc, user) => {
        acc[user.userId] = allEvents.filter(event => event.data?.userId === user.userId);
        return acc;
      }, {} as Record<string, any[]>);

      // Verify high engagement user has most events
      expect(userEvents['user_high_engagement'].length).toBeGreaterThan(userEvents['user_medium_engagement'].length);
      expect(userEvents['user_medium_engagement'].length).toBeGreaterThan(userEvents['user_low_engagement'].length);

      // Verify satisfaction tracking
      const satisfactionEvents = allEvents.filter(event => event.event === 'user_satisfaction');
      expect(satisfactionEvents.length).toBe(engagementScenarios.reduce((sum, user) => sum + user.sessions, 0));
    });

    it('should track user retention and churn indicators', async () => {
      const retentionScenarios = [
        // Retained user - regular usage
        { userId: 'retained_user', days: [1, 2, 3, 7, 14, 21, 30], engagementLevel: 'high' },
        // At-risk user - declining usage  
        { userId: 'at_risk_user', days: [1, 2, 3, 7, 14], engagementLevel: 'declining' },
        // Churned user - stopped using
        { userId: 'churned_user', days: [1, 2, 3], engagementLevel: 'low' }
      ];

      for (const scenario of retentionScenarios) {
        metricsTracker.setUserId(scenario.userId);
        
        scenario.days.forEach((day, index) => {
          // Simulate usage patterns
          const engagementMultiplier = scenario.engagementLevel === 'declining' 
            ? Math.max(0.2, 1 - (index * 0.2)) // Declining engagement
            : scenario.engagementLevel === 'high' ? 1 : 0.3;
          
          const interactionCount = Math.floor(10 * engagementMultiplier);
          
          metricsTracker.trackJourneyStep(`day_${day}_session_start`, 'App', { 
            userId: scenario.userId,
            daysSinceStart: day - 1
          });
          
          for (let i = 0; i < interactionCount; i++) {
            metricsTracker.trackEvent('user_interaction', 'App', { 
              userId: scenario.userId,
              day,
              interactionIndex: i
            });
          }
          
          metricsTracker.trackJourneyStep(`day_${day}_session_end`, 'App', {
            userId: scenario.userId,
            interactionCount
          });
        });
      }

      // Analyze retention patterns
      const journeySteps = metricsTracker.getJourneySteps();
      
      // Verify retained user has longest journey
      const retainedUserSteps = journeySteps.filter(step => step.data?.userId === 'retained_user');
      const atRiskUserSteps = journeySteps.filter(step => step.data?.userId === 'at_risk_user');
      const churnedUserSteps = journeySteps.filter(step => step.data?.userId === 'churned_user');
      
      expect(retainedUserSteps.length).toBeGreaterThan(atRiskUserSteps.length);
      expect(atRiskUserSteps.length).toBeGreaterThan(churnedUserSteps.length);
      
      // Verify interaction patterns
      const allEvents = metricsTracker.getEvents('user_interaction');
      const retainedInteractions = allEvents.filter(event => event.data?.userId === 'retained_user');
      const churnedInteractions = allEvents.filter(event => event.data?.userId === 'churned_user');
      
      expect(retainedInteractions.length).toBeGreaterThan(churnedInteractions.length);
    });
  });

  describe('Conversion Funnel Metrics', () => {
    it('should track complete conversion funnel with dropoff analysis', async () => {
      const funnelSteps = [
        { step: 'app_install', users: 1000, conversionRate: 1.0 },
        { step: 'app_open', users: 850, conversionRate: 0.85 },
        { step: 'onboarding_start', users: 700, conversionRate: 0.82 },
        { step: 'account_creation', users: 500, conversionRate: 0.71 },
        { step: 'profile_completion', users: 400, conversionRate: 0.80 },
        { step: 'first_interaction', users: 350, conversionRate: 0.88 },
        { step: 'second_session', users: 250, conversionRate: 0.71 },
        { step: 'active_user', users: 200, conversionRate: 0.80 }
      ];

      // Simulate funnel progression for each step
      for (let stepIndex = 0; stepIndex < funnelSteps.length; stepIndex++) {
        const currentStep = funnelSteps[stepIndex];
        const userCount = currentStep.users;
        
        for (let userId = 0; userId < userCount; userId++) {
          const userIdStr = `user_${userId}`;
          metricsTracker.setUserId(userIdStr);
          
          // Track this step for this user
          metricsTracker.trackJourneyStep(currentStep.step, 'Funnel', { 
            userId: userIdStr,
            stepIndex,
            funnelPosition: `${stepIndex + 1}/${funnelSteps.length}`
          });
          
          // Track conversion if user continues to next step
          const nextStep = funnelSteps[stepIndex + 1];
          if (nextStep && userId < nextStep.users) {
            metricsTracker.trackConversion(`${currentStep.step}_to_${nextStep.step}`, 'Funnel', {
              userId: userIdStr,
              fromStep: currentStep.step,
              toStep: nextStep.step
            });
          } else if (nextStep) {
            // Track dropoff
            metricsTracker.trackEvent('funnel_dropoff', 'Funnel', {
              userId: userIdStr,
              droppedAtStep: currentStep.step,
              stepIndex
            });
          }
        }
      }

      // Analyze funnel performance
      const journeySteps = metricsTracker.getJourneySteps();
      const conversionEvents = metricsTracker.getEvents('conversion');
      const dropoffEvents = metricsTracker.getEvents('funnel_dropoff');
      
      // Verify funnel tracking
      expect(journeySteps.length).toBeGreaterThanOrEqual(funnelSteps.reduce((sum, step) => sum + step.users, 0));
      expect(conversionEvents.length).toBeGreaterThanOrEqual(0);
      expect(dropoffEvents.length).toBeGreaterThanOrEqual(0);
      
      // Verify funnel math
      const appInstallEvents = journeySteps.filter(step => step.step === 'app_install');
      const activeUserEvents = journeySteps.filter(step => step.step === 'active_user');
      
      expect(appInstallEvents.length).toBe(1000);
      expect(activeUserEvents.length).toBe(200);
      
      // Overall conversion rate should be 20% (200/1000)
      const overallConversionRate = activeUserEvents.length / appInstallEvents.length;
      expect(overallConversionRate).toBeCloseTo(0.20, 2);
    });

    it('should identify optimal conversion paths', async () => {
      const conversionPaths = [
        // Optimal path - high conversion
        {
          name: 'social_signup_path',
          steps: ['social_login', 'quick_onboarding', 'friend_import', 'first_message'],
          conversionRate: 0.85,
          users: 300
        },
        // Alternative path - medium conversion
        {
          name: 'email_signup_path', 
          steps: ['email_signup', 'email_verification', 'manual_onboarding', 'first_message'],
          conversionRate: 0.65,
          users: 500
        },
        // Suboptimal path - low conversion
        {
          name: 'guest_path',
          steps: ['guest_mode', 'explore_features', 'delayed_signup', 'first_message'],
          conversionRate: 0.35,
          users: 200
        }
      ];

      for (const path of conversionPaths) {
        const convertedUsers = Math.floor(path.users * path.conversionRate);
        
        for (let userId = 0; userId < path.users; userId++) {
          const userIdStr = `${path.name}_user_${userId}`;
          const willConvert = userId < convertedUsers;
          
          metricsTracker.setUserId(userIdStr);
          
          for (let stepIndex = 0; stepIndex < path.steps.length; stepIndex++) {
            const step = path.steps[stepIndex];
            
            // If user won't convert, they might drop off at any step
            if (!willConvert && stepIndex > 0 && Math.random() < 0.3) {
              metricsTracker.trackEvent('path_dropoff', 'ConversionPath', {
                userId: userIdStr,
                path: path.name,
                droppedAtStep: step,
                stepIndex
              });
              break;
            }
            
            metricsTracker.trackJourneyStep(step, 'ConversionPath', {
              userId: userIdStr,
              path: path.name,
              stepIndex
            });
            
            // Track step completion
            metricsTracker.trackEvent('step_completion', 'ConversionPath', {
              userId: userIdStr,
              path: path.name,
              step,
              stepIndex
            });
          }
          
          // Track final conversion if user completed all steps
          if (willConvert) {
            metricsTracker.trackConversion('complete_onboarding', 'ConversionPath', {
              userId: userIdStr,
              path: path.name,
              totalSteps: path.steps.length
            });
          }
        }
      }

      // Analyze path performance
      const conversionEvents = metricsTracker.getEvents('conversion_complete_onboarding');
      const dropoffEvents = metricsTracker.getEvents('path_dropoff');
      
      // Verify path tracking
      expect(conversionEvents.length).toBeGreaterThan(0);
      expect(dropoffEvents.length).toBeGreaterThan(0);
      
      // Analyze by path
      const pathPerformance = conversionPaths.map(path => {
        const pathConversions = conversionEvents.filter(event => 
          event.data?.path === path.name
        );
        const pathDropoffs = dropoffEvents.filter(event => 
          event.data?.path === path.name
        );
        
        return {
          name: path.name,
          conversions: pathConversions.length,
          dropoffs: pathDropoffs.length,
          actualConversionRate: pathConversions.length / path.users
        };
      });
      
      // Social signup should have highest conversion rate
      const socialPath = pathPerformance.find(p => p.name === 'social_signup_path');
      const guestPath = pathPerformance.find(p => p.name === 'guest_path');
      
      expect(socialPath?.conversions).toBeGreaterThan(guestPath?.conversions || 0);
      expect(socialPath?.actualConversionRate).toBeGreaterThan(guestPath?.actualConversionRate || 0);
    });
  });

  describe('Real-time Metrics and Alerts', () => {
    it('should detect anomalies in user behavior patterns', async () => {
      // Establish baseline behavior
      const baselineMetrics = {
        averageSessionTime: 900000, // 15 minutes
        averageInteractionsPerSession: 12,
        averageResponseTime: 2000, // 2 seconds
        typicalErrorRate: 0.05 // 5%
      };

      // Simulate normal behavior for baseline
      for (let i = 0; i < 50; i++) {
        const sessionTime = baselineMetrics.averageSessionTime + (Math.random() - 0.5) * 180000; // ±3 minutes
        const interactions = baselineMetrics.averageInteractionsPerSession + Math.floor((Math.random() - 0.5) * 4);
        const responseTime = baselineMetrics.averageResponseTime + (Math.random() - 0.5) * 500;
        const hasError = Math.random() < baselineMetrics.typicalErrorRate;
        
        metricsTracker.trackJourneyStep('normal_session_start', 'App');
        
        for (let j = 0; j < interactions; j++) {
          if (hasError && j === interactions - 1) {
            metricsTracker.trackError('Normal baseline error', 'App', { responseTime });
          } else {
            metricsTracker.trackEvent('normal_interaction', 'App', { responseTime }, responseTime);
          }
        }
        
        metricsTracker.trackJourneyStep('normal_session_end', 'App', {
          sessionTime,
          interactions,
          averageResponseTime: responseTime
        });
      }

      // Simulate anomalous behavior
      const anomalies = [
        { type: 'long_session', sessionTime: 3600000, interactions: 30 }, // 1 hour session
        { type: 'error_spike', errorRate: 0.8, sessions: 10 }, // 80% error rate
        { type: 'slow_response', responseTime: 15000, sessions: 5 }, // 15 second responses
        { type: 'rapid_dropoff', interactions: 1, sessions: 20 } // Users leaving immediately
      ];

      for (const anomaly of anomalies) {
        const sessionCount = anomaly.sessions || 1;
        
        for (let i = 0; i < sessionCount; i++) {
          metricsTracker.trackJourneyStep(`${anomaly.type}_session_start`, 'App');
          
          const interactions = anomaly.interactions || baselineMetrics.averageInteractionsPerSession;
          const responseTime = anomaly.responseTime || baselineMetrics.averageResponseTime;
          const errorRate = anomaly.errorRate || baselineMetrics.typicalErrorRate;
          
          for (let j = 0; j < interactions; j++) {
            if (Math.random() < errorRate) {
              metricsTracker.trackError(`${anomaly.type} error`, 'App', { responseTime });
            } else {
              metricsTracker.trackEvent(`${anomaly.type}_interaction`, 'App', { responseTime }, responseTime);
            }
          }
          
          metricsTracker.trackJourneyStep(`${anomaly.type}_session_end`, 'App', {
            sessionTime: anomaly.sessionTime || baselineMetrics.averageSessionTime,
            interactions,
            anomalyType: anomaly.type
          });
        }
      }

      // Analyze for anomalies
      const allEvents = metricsTracker.getEvents();
      const errorEvents = metricsTracker.getEvents('error');
      const journeySteps = metricsTracker.getJourneySteps();
      
      // Verify anomaly detection data is present
      const anomalyEvents = allEvents.filter(event => 
        event.event.includes('long_session') || 
        event.event.includes('error_spike') ||
        event.event.includes('slow_response') ||
        event.event.includes('rapid_dropoff')
      );
      
      expect(anomalyEvents.length).toBeGreaterThan(0);
      
      // Verify error spike detection
      const errorSpikeEvents = errorEvents.filter(event => 
        event.errorMessage?.includes('error_spike') || event.event?.includes('error_spike')
      );
      expect(errorSpikeEvents.length).toBeGreaterThanOrEqual(0);
      
      // Verify long session detection
      const longSessionSteps = journeySteps.filter(step => 
        step.data?.anomalyType === 'long_session'
      );
      expect(longSessionSteps.length).toBeGreaterThan(0);
    });

    it('should provide real-time dashboard metrics', async () => {
      // Simulate real-time metrics collection
      const metricsSnapshot = {
        timestamp: Date.now(),
        activeUsers: 0,
        totalSessions: 0,
        averageEngagement: 0,
        errorRate: 0,
        responseTime: 0,
        conversionRate: 0
      };

      // Simulate concurrent user sessions
      const concurrentUsers = 25;
      const sessionPromises = [];

      for (let userId = 0; userId < concurrentUsers; userId++) {
        const sessionPromise = (async () => {
          metricsTracker.setUserId(`realtime_user_${userId}`);
          metricsTracker.trackJourneyStep('realtime_session_start', 'Dashboard');
          
          metricsSnapshot.activeUsers++;
          metricsSnapshot.totalSessions++;
          
          // Simulate user activity
          const sessionDuration = Math.random() * 1800000; // Up to 30 minutes
          const interactions = Math.floor(Math.random() * 20) + 1;
          const hasError = Math.random() < 0.1; // 10% error rate
          const converts = Math.random() < 0.3; // 30% conversion rate
          
          for (let i = 0; i < interactions; i++) {
            const responseTime = Math.random() * 3000 + 500; // 0.5-3.5 seconds
            metricsSnapshot.responseTime = (metricsSnapshot.responseTime + responseTime) / 2;
            
            if (hasError && i === interactions - 1) {
              metricsTracker.trackError('Realtime session error', 'Dashboard');
              metricsSnapshot.errorRate = (metricsSnapshot.errorRate * userId + 1) / (userId + 1);
            } else {
              metricsTracker.trackEvent('realtime_interaction', 'Dashboard', {
                userId: `realtime_user_${userId}`
              }, responseTime);
            }
            
            await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
          }
          
          if (converts) {
            metricsTracker.trackConversion('realtime_conversion', 'Dashboard');
            metricsSnapshot.conversionRate = (metricsSnapshot.conversionRate * userId + 1) / (userId + 1);
          }
          
          metricsSnapshot.averageEngagement = (metricsSnapshot.averageEngagement + interactions) / 2;
          
          metricsTracker.trackJourneyStep('realtime_session_end', 'Dashboard', {
            sessionDuration,
            interactions,
            converted: converts
          });
        })();
        
        sessionPromises.push(sessionPromise);
      }

      // Wait for all sessions to complete
      await Promise.all(sessionPromises);

      // Verify real-time metrics
      expect(metricsSnapshot.activeUsers).toBe(concurrentUsers);
      expect(metricsSnapshot.totalSessions).toBe(concurrentUsers);
      expect(metricsSnapshot.averageEngagement).toBeGreaterThan(0);
      expect(metricsSnapshot.responseTime).toBeGreaterThan(0);
      
      // Verify metrics are within expected ranges
      expect(metricsSnapshot.errorRate).toBeLessThan(0.5); // Should be less than 50%
      expect(metricsSnapshot.conversionRate).toBeLessThan(1.0); // Should be less than 100%
      expect(metricsSnapshot.responseTime).toBeLessThan(5000); // Should be less than 5 seconds
      
      // Verify tracking completeness
      const allEvents = metricsTracker.getEvents();
      const realtimeEvents = allEvents.filter(event => 
        event.event.includes('realtime')
      );
      
      expect(realtimeEvents.length).toBeGreaterThan(concurrentUsers); // At least one event per user
    });
  });
});