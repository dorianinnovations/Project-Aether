/**
 * useMetrics Hook
 * React hook for easy metrics tracking throughout the app
 */

import { useEffect, useRef, useCallback } from 'react';
import { metricsTracker, MetricEvent, UserJourneyStep, ChokePoint } from '../services/metricsTracker';

interface UseMetricsReturn {
  trackJourneyStep: (step: string, screen: string, data?: any) => void;
  trackEvent: (event: string, screen?: string, data?: any, duration?: number) => void;
  trackChokePoint: (name: string, success: boolean, duration?: number, errorMessage?: string) => void;
  trackUserSatisfaction: (screen: string, rating: number, feedback?: string) => void;
  trackConversion: (type: string, screen: string, data?: any) => void;
  trackError: (error: string, screen: string, context?: any) => void;
  startTiming: (eventName: string) => () => void;
  getSessionMetrics: () => {
    events: MetricEvent[];
    journeySteps: UserJourneyStep[];
    chokepoints: Map<string, ChokePoint>;
  };
}

export const useMetrics = (screenName?: string): UseMetricsReturn => {
  const screenRef = useRef(screenName);
  const timingRef = useRef<Map<string, number>>(new Map());

  // Update screen name reference
  useEffect(() => {
    screenRef.current = screenName;
  }, [screenName]);

  // Track screen entry
  useEffect(() => {
    if (screenName) {
      metricsTracker.trackJourneyStep('screen_entered', screenName);
      metricsTracker.trackEvent('screen_view', screenName, {
        entryTime: Date.now()
      });

      // Track screen exit on unmount
      return () => {
        metricsTracker.trackJourneyStep('screen_exited', screenName);
        metricsTracker.trackEvent('screen_exit', screenName, {
          exitTime: Date.now()
        });
      };
    }
  }, [screenName]);

  const trackJourneyStep = useCallback((step: string, screen?: string, data?: any) => {
    const targetScreen = screen || screenRef.current || 'unknown';
    metricsTracker.trackJourneyStep(step, targetScreen, data);
  }, []);

  const trackEvent = useCallback((event: string, screen?: string, data?: any, duration?: number) => {
    const targetScreen = screen || screenRef.current;
    metricsTracker.trackEvent(event, targetScreen, data, duration);
  }, []);

  const trackChokePoint = useCallback((name: string, success: boolean, duration?: number, errorMessage?: string) => {
    metricsTracker.trackChokePointAttempt(name, success, duration, errorMessage);
  }, []);

  const trackUserSatisfaction = useCallback((screen: string, rating: number, feedback?: string) => {
    metricsTracker.trackUserSatisfaction(screen, rating, feedback);
  }, []);

  const trackConversion = useCallback((type: string, screen?: string, data?: any) => {
    const targetScreen = screen || screenRef.current || 'unknown';
    metricsTracker.trackConversion(type, targetScreen, data);
  }, []);

  const trackError = useCallback((error: string, screen?: string, context?: any) => {
    const targetScreen = screen || screenRef.current || 'unknown';
    metricsTracker.trackError(error, targetScreen, context);
  }, []);

  const startTiming = useCallback((eventName: string) => {
    const startTime = Date.now();
    timingRef.current.set(eventName, startTime);
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      timingRef.current.delete(eventName);
      
      trackEvent(eventName, undefined, { duration }, duration);
      return duration;
    };
  }, [trackEvent]);

  const getSessionMetrics = useCallback(() => {
    return {
      events: metricsTracker.getEvents(),
      journeySteps: metricsTracker.getJourneySteps(),
      chokepoints: metricsTracker.getChokepointMetrics() as Map<string, ChokePoint>
    };
  }, []);

  return {
    trackJourneyStep,
    trackEvent,
    trackChokePoint,
    trackUserSatisfaction,
    trackConversion,
    trackError,
    startTiming,
    getSessionMetrics
  };
};

// Specialized hooks for specific screens
export const useChatMetrics = () => {
  const metrics = useMetrics('Chat');
  
  const trackMessageSent = useCallback((messageLength: number, attachmentCount: number = 0) => {
    metrics.trackJourneyStep('message_sent', 'Chat', { messageLength, attachmentCount });
    metrics.trackChokePoint('message_sending', true);
  }, [metrics]);

  const trackMessageError = useCallback((error: string) => {
    metrics.trackError(error, 'Chat', { context: 'message_sending' });
    metrics.trackChokePoint('message_sending', false, undefined, error);
  }, [metrics]);

  const trackAIResponse = useCallback((responseTime: number, wordCount: number) => {
    metrics.trackJourneyStep('ai_response_received', 'Chat', { responseTime, wordCount });
    metrics.trackChokePoint('ai_response_generation', true, responseTime);
  }, [metrics]);

  const trackAIResponseError = useCallback((error: string, responseTime: number) => {
    metrics.trackError(error, 'Chat', { context: 'ai_response_generation', responseTime });
    metrics.trackChokePoint('ai_response_generation', false, responseTime, error);
  }, [metrics]);

  return {
    ...metrics,
    trackMessageSent,
    trackMessageError,
    trackAIResponse,
    trackAIResponseError
  };
};

export const useAuthMetrics = () => {
  const metrics = useMetrics('Auth');
  
  const trackSignInAttempt = useCallback((email: string, success: boolean, error?: string) => {
    metrics.trackJourneyStep(success ? 'signin_success' : 'signin_failure', 'SignIn');
    metrics.trackChokePoint('signin_form_submission', success, undefined, error);
    
    if (success) {
      metrics.trackConversion('signin', 'SignIn', { email });
    }
  }, [metrics]);

  const trackSignUpAttempt = useCallback((email: string, success: boolean, error?: string) => {
    metrics.trackJourneyStep(success ? 'signup_success' : 'signup_failure', 'SignUp');
    metrics.trackChokePoint('signup_form_submission', success, undefined, error);
    
    if (success) {
      metrics.trackConversion('signup', 'SignUp', { email });
    }
  }, [metrics]);

  const trackPasswordStrengthCheck = useCallback((strength: number) => {
    metrics.trackEvent('password_strength_checked', 'SignUp', { strength });
  }, [metrics]);

  return {
    ...metrics,
    trackSignInAttempt,
    trackSignUpAttempt,
    trackPasswordStrengthCheck
  };
};

export const useConnectionsMetrics = () => {
  const metrics = useMetrics('Connections');
  
  const trackConnectionRequest = useCallback((targetUserId: string, success: boolean, error?: string) => {
    metrics.trackJourneyStep(success ? 'connection_request_sent' : 'connection_request_failed', 'Connections');
    metrics.trackChokePoint('connection_request_sending', success, undefined, error);
    
    if (success) {
      metrics.trackConversion('connection_request', 'Connections', { targetUserId });
    }
  }, [metrics]);

  const trackCompatibilityCalculation = useCallback((score: number, calculationTime: number) => {
    metrics.trackJourneyStep('compatibility_calculated', 'Connections', { score });
    metrics.trackChokePoint('compatibility_calculation', true, calculationTime);
  }, [metrics]);

  const trackConnectionsLoad = useCallback((connectionCount: number, loadTime: number, success: boolean) => {
    metrics.trackJourneyStep('connections_loaded', 'Connections', { connectionCount });
    metrics.trackChokePoint('connections_loading', success, loadTime);
  }, [metrics]);

  return {
    ...metrics,
    trackConnectionRequest,
    trackCompatibilityCalculation,
    trackConnectionsLoad
  };
};

export const useInsightsMetrics = () => {
  const metrics = useMetrics('Insights');
  
  const trackInsightsLoad = useCallback((insightCount: number, loadTime: number, success: boolean) => {
    metrics.trackJourneyStep('insights_loaded', 'Insights', { insightCount });
    metrics.trackChokePoint('insights_data_loading', success, loadTime);
  }, [metrics]);

  const trackPersonalityAnalysis = useCallback((analysisTime: number, success: boolean) => {
    metrics.trackJourneyStep('personality_analyzed', 'Insights');
    metrics.trackChokePoint('personality_analysis', success, analysisTime);
  }, [metrics]);

  const trackBehavioralPatterns = useCallback((patternCount: number, analysisTime: number) => {
    metrics.trackJourneyStep('behavioral_patterns_identified', 'Insights', { patternCount });
    metrics.trackChokePoint('behavioral_pattern_recognition', true, analysisTime);
  }, [metrics]);

  const trackInsightInteraction = useCallback((insightType: string, interactionType: string) => {
    metrics.trackEvent('insight_interaction', 'Insights', { insightType, interactionType });
  }, [metrics]);

  return {
    ...metrics,
    trackInsightsLoad,
    trackPersonalityAnalysis,
    trackBehavioralPatterns,
    trackInsightInteraction
  };
};