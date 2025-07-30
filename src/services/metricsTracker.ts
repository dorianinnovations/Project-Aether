/**
 * Metrics Tracker Service
 * Tracks user journey chokepoints and key interactions throughout the app
 */

interface MetricEvent {
  id: string;
  event: string;
  screen?: string;
  timestamp: number;
  duration?: number;
  data?: any;
  sessionId: string;
  userId?: string;
  success?: boolean;
  errorMessage?: string;
}

interface UserJourneyStep {
  step: string;
  screen: string;
  timestamp: number;
  previousStep?: string;
  timeFromPrevious?: number;
  data?: any;
}

interface ChokePoint {
  name: string;
  screen: string;
  description: string;
  successRate: number;
  averageTime: number;
  totalAttempts: number;
  failureReasons: string[];
}

class MetricsTracker {
  private events: MetricEvent[] = [];
  private journeySteps: UserJourneyStep[] = [];
  private chokePoints: Map<string, ChokePoint> = new Map();
  private sessionId: string;
  private userId?: string;
  private sessionStartTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.initializeChokePoints();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeChokePoints(): void {
    // Define critical user journey chokepoints
    const initialChokePoints = [
      // App Initialization
      {
        name: 'app_initialization',
        screen: 'App',
        description: 'App startup and initial loading',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'font_loading',
        screen: 'App',
        description: 'Custom font loading completion',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'auth_check',
        screen: 'App',
        description: 'Authentication status verification',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },

      // Authentication Flow
      {
        name: 'signin_form_submission',
        screen: 'SignIn',
        description: 'User submits sign in form',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'signup_form_submission',
        screen: 'SignUp',
        description: 'User submits sign up form',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'auth_api_response',
        screen: 'Auth',
        description: 'Authentication API response received',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },

      // Chat Interactions
      {
        name: 'message_sending',
        screen: 'Chat',
        description: 'User sends message to AI',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'ai_response_generation',
        screen: 'Chat',
        description: 'AI generates response to user message',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'message_display',
        screen: 'Chat',
        description: 'Message successfully displayed in chat',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },

      // Connections Flow
      {
        name: 'connections_loading',
        screen: 'Connections',
        description: 'Loading user connections list',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'connection_request_sending',
        screen: 'Connections',
        description: 'Sending connection request to another user',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'compatibility_calculation',
        screen: 'Connections',
        description: 'Calculating compatibility scores',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },

      // Insights Generation
      {
        name: 'insights_data_loading',
        screen: 'Insights',
        description: 'Loading user insights and analytics',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'personality_analysis',
        screen: 'Insights',
        description: 'Generating personality analysis',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'behavioral_pattern_recognition',
        screen: 'Insights',
        description: 'Identifying behavioral patterns',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },

      // Navigation and UX
      {
        name: 'screen_navigation',
        screen: 'Global',
        description: 'Navigation between app screens',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      },
      {
        name: 'animation_completion',
        screen: 'Global',
        description: 'UI animations completing successfully',
        successRate: 0,
        averageTime: 0,
        totalAttempts: 0,
        failureReasons: []
      }
    ];

    initialChokePoints.forEach(cp => {
      this.chokePoints.set(cp.name, cp);
    });
  }

  // Track user journey step
  trackJourneyStep(step: string, screen: string, data?: any): void {
    const timestamp = Date.now();
    const previousStep = this.journeySteps[this.journeySteps.length - 1];
    
    const journeyStep: UserJourneyStep = {
      step,
      screen,
      timestamp,
      data,
      previousStep: previousStep?.step,
      timeFromPrevious: previousStep ? timestamp - previousStep.timestamp : undefined
    };

    this.journeySteps.push(journeyStep);

    // Also track as metric event
    this.trackEvent(`journey_step_${step}`, screen, data);
  }

  // Track specific metric event
  trackEvent(event: string, screen?: string, data?: any, duration?: number): void {
    const metricEvent: MetricEvent = {
      id: this.generateEventId(),
      event,
      screen,
      timestamp: Date.now(),
      duration,
      data,
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.events.push(metricEvent);
  }

  // Track chokepoint attempt
  trackChokePointAttempt(chokepointName: string, success: boolean, duration?: number, errorMessage?: string): void {
    const chokepoint = this.chokePoints.get(chokepointName);
    if (!chokepoint) {
      console.warn(`Unknown chokepoint: ${chokepointName}`);
      return;
    }

    chokepoint.totalAttempts++;
    
    if (success) {
      chokepoint.successRate = ((chokepoint.successRate * (chokepoint.totalAttempts - 1)) + 1) / chokepoint.totalAttempts;
    } else {
      chokepoint.successRate = (chokepoint.successRate * (chokepoint.totalAttempts - 1)) / chokepoint.totalAttempts;
      if (errorMessage) {
        chokepoint.failureReasons.push(errorMessage);
      }
    }

    if (duration) {
      chokepoint.averageTime = ((chokepoint.averageTime * (chokepoint.totalAttempts - 1)) + duration) / chokepoint.totalAttempts;
    }

    // Track as event
    this.trackEvent(`chokepoint_${chokepointName}`, chokepoint.screen, {
      success,
      duration,
      errorMessage,
      successRate: chokepoint.successRate,
      averageTime: chokepoint.averageTime
    }, duration);
  }

  // Track user satisfaction at key points
  trackUserSatisfaction(screen: string, rating: number, feedback?: string): void {
    this.trackEvent('user_satisfaction', screen, {
      rating,
      feedback,
      timestamp: Date.now()
    });
  }

  // Track conversion events
  trackConversion(conversionType: string, screen: string, data?: any): void {
    this.trackEvent(`conversion_${conversionType}`, screen, {
      ...data,
      conversionTime: Date.now() - this.sessionStartTime
    });
  }

  // Track error events
  trackError(error: string, screen: string, context?: any): void {
    this.trackEvent('error', screen, {
      error,
      context,
      severity: this.getErrorSeverity(error)
    });
  }

  // Get user journey analysis
  getJourneyAnalysis(): {
    totalSteps: number;
    sessionDuration: number;
    averageStepTime: number;
    commonPaths: string[];
    dropoffPoints: string[];
    chokepointPerformance: Map<string, ChokePoint>;
  } {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const totalSteps = this.journeySteps.length;
    
    const stepTimes = this.journeySteps
      .filter(step => step.timeFromPrevious)
      .map(step => step.timeFromPrevious!);
    
    const averageStepTime = stepTimes.length > 0 
      ? stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length 
      : 0;

    // Analyze common paths
    const paths = this.journeySteps
      .slice(1)
      .map((step, index) => `${this.journeySteps[index].step}->${step.step}`);
    
    const pathCounts = paths.reduce((counts, path) => {
      counts[path] = (counts[path] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const commonPaths = Object.entries(pathCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([path]) => path);

    // Find potential dropoff points (steps with unusually long times)
    const longSteps = this.journeySteps
      .filter(step => step.timeFromPrevious && step.timeFromPrevious > averageStepTime * 2)
      .map(step => step.step);

    return {
      totalSteps,
      sessionDuration,
      averageStepTime,
      commonPaths,
      dropoffPoints: Array.from(new Set(longSteps)),
      chokepointPerformance: this.chokePoints
    };
  }

  // Get performance metrics for specific chokepoints
  getChokepointMetrics(chokepointName?: string): Map<string, ChokePoint> | ChokePoint | null {
    if (chokepointName) {
      return this.chokePoints.get(chokepointName) || null;
    }
    return this.chokePoints;
  }

  // Get events for analysis
  getEvents(eventType?: string, screen?: string): MetricEvent[] {
    let filteredEvents = this.events;

    if (eventType) {
      filteredEvents = filteredEvents.filter(event => event.event.includes(eventType));
    }

    if (screen) {
      filteredEvents = filteredEvents.filter(event => event.screen === screen);
    }

    return filteredEvents;
  }

  // Get user journey steps
  getJourneySteps(screen?: string): UserJourneyStep[] {
    if (screen) {
      return this.journeySteps.filter(step => step.screen === screen);
    }
    return this.journeySteps;
  }

  // Export metrics for analysis
  exportMetrics(): {
    sessionId: string;
    userId?: string;
    sessionDuration: number;
    events: MetricEvent[];
    journeySteps: UserJourneyStep[];
    chokepoints: Record<string, ChokePoint>;
    analysis: {
      totalSteps: number;
      sessionDuration: number;
      averageStepTime: number;
      commonPaths: string[];
      dropoffPoints: string[];
      chokepointPerformance: Map<string, ChokePoint>;
    };
  } {
    const chokepointsObject = Object.fromEntries(this.chokePoints);
    
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      sessionDuration: Date.now() - this.sessionStartTime,
      events: this.events,
      journeySteps: this.journeySteps,
      chokepoints: chokepointsObject,
      analysis: this.getJourneyAnalysis()
    };
  }

  // Set user ID when available
  setUserId(userId: string): void {
    this.userId = userId;
    this.trackEvent('user_identified', 'Global', { userId });
  }

  // Clear metrics (for testing or privacy)
  clearMetrics(): void {
    this.events = [];
    this.journeySteps = [];
    this.initializeChokePoints();
    this.sessionStartTime = Date.now();
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getErrorSeverity(error: string): 'low' | 'medium' | 'high' | 'critical' {
    if (error.includes('network') || error.includes('timeout')) return 'medium';
    if (error.includes('auth') || error.includes('permission')) return 'high';
    if (error.includes('crash') || error.includes('fatal')) return 'critical';
    return 'low';
  }
}

// Export singleton instance
export const metricsTracker = new MetricsTracker();

// Export types for use in components
export type { MetricEvent, UserJourneyStep, ChokePoint };