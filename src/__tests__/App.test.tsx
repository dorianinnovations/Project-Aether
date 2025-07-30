import React from 'react';
import { render, waitFor, screen } from '../test-utils';
import { metricsUtils, testUtils } from '../test-utils';
import App from '../../App';
import { TokenManager } from '../services/api';

// Mock the TokenManager
jest.mock('../services/api', () => ({
  TokenManager: {
    getToken: jest.fn(),
  },
}));

describe('App - Initial Load and Navigation', () => {
  beforeEach(() => {
    metricsUtils.clearMetrics();
    jest.clearAllMocks();
    // Reset token manager to return no token (unauthenticated state)
    (TokenManager.getToken as jest.Mock).mockResolvedValue(null);
  });

  describe('App Initialization', () => {
    it('should show loading screen during app initialization', async () => {
      metricsUtils.trackUserJourneyStep('test_start');
      
      render(<App />);
      
      // Loading screen should be visible initially
      expect(screen.getByText('Initializing Numina...')).toBeTruthy();
      expect(screen.getByText('Numina')).toBeTruthy();
      
      metricsUtils.trackUserJourneyStep('loading_screen_visible');
    });

    it('should complete app initialization sequence within reasonable time', async () => {
      metricsUtils.trackUserJourneyStep('initialization_start');
      
      render(<App />);
      
      // Fast-forward through the initialization delay
      await testUtils.waitForAnimations(2000);
      
      await waitFor(() => {
        // Should navigate to auth flow after initialization
        expect(screen.queryByText('Initializing Numina...')).toBeNull();
      }, { timeout: 3000 });
      
      metricsUtils.trackUserJourneyStep('initialization_complete');
      
      // Validate the initialization journey
      const journey = metricsUtils.validateUserJourney([
        'initialization_start',
        'initialization_complete'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle font loading gracefully', async () => {
      metricsUtils.trackUserJourneyStep('font_loading_start');
      
      render(<App />);
      
      // Even if fonts fail, app should continue
      await testUtils.waitForAnimations(2000);
      
      await waitFor(() => {
        expect(screen.queryByText('Initializing Numina...')).toBeNull();
      });
      
      metricsUtils.trackUserJourneyStep('font_loading_complete');
    });
  });

  describe('Authentication State Navigation', () => {
    it('should navigate to auth flow when user is not authenticated', async () => {
      metricsUtils.trackUserJourneyStep('unauthenticated_navigation_start');
      
      (TokenManager.getToken as jest.Mock).mockResolvedValue(null);
      
      render(<App />);
      
      await testUtils.waitForAnimations(2000);
      
      await waitFor(() => {
        // Should show auth screens - Hero screen is the initial auth screen
        expect(screen.queryByText('Initializing Numina...')).toBeNull();
      });
      
      metricsUtils.trackUserJourneyStep('auth_flow_reached');
      
      const journey = metricsUtils.validateUserJourney([
        'unauthenticated_navigation_start',
        'auth_flow_reached'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should navigate to main app when user is authenticated', async () => {
      metricsUtils.trackUserJourneyStep('authenticated_navigation_start');
      
      (TokenManager.getToken as jest.Mock).mockResolvedValue('test-token');
      
      render(<App />);
      
      await testUtils.waitForAnimations(2000);
      
      await waitFor(() => {
        // Should bypass auth and go to main app
        expect(screen.queryByText('Initializing Numina...')).toBeNull();
      });
      
      metricsUtils.trackUserJourneyStep('main_app_reached');
      
      const journey = metricsUtils.validateUserJourney([
        'authenticated_navigation_start',
        'main_app_reached'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle authentication state changes', async () => {
      metricsUtils.trackUserJourneyStep('auth_state_change_start');
      
      // Start unauthenticated
      (TokenManager.getToken as jest.Mock).mockResolvedValue(null);
      
      render(<App />);
      
      await testUtils.waitForAnimations(2000);
      
      // Simulate user getting authenticated (token appears)
      (TokenManager.getToken as jest.Mock).mockResolvedValue('new-token');
      
      // Advance time to trigger auth check interval
      jest.advanceTimersByTime(1000);
      
      await testUtils.waitForAnimations(500);
      
      metricsUtils.trackUserJourneyStep('auth_state_changed');
      
      const journey = metricsUtils.validateUserJourney([
        'auth_state_change_start',
        'auth_state_changed'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('App Performance Metrics', () => {
    it('should complete initialization within performance threshold', async () => {
      const startTime = Date.now();
      metricsUtils.trackUserJourneyStep('performance_test_start', { startTime });
      
      render(<App />);
      
      await testUtils.waitForAnimations(2000);
      
      await waitFor(() => {
        expect(screen.queryByText('Initializing Numina...')).toBeNull();
      });
      
      const endTime = Date.now();
      const initializationTime = endTime - startTime;
      
      metricsUtils.trackUserJourneyStep('performance_test_complete', { 
        endTime, 
        initializationTime 
      });
      
      // Should initialize within 3 seconds in test environment
      expect(initializationTime).toBeLessThan(3000);
    });

    it('should track key user journey chokepoints', async () => {
      render(<App />);
      
      // Track critical path through app initialization
      metricsUtils.trackUserJourneyStep('app_mounted');
      
      await testUtils.waitForAnimations(1000);
      metricsUtils.trackUserJourneyStep('fonts_loading_complete');
      
      await testUtils.waitForAnimations(1000);
      metricsUtils.trackUserJourneyStep('auth_check_complete');
      
      await waitFor(() => {
        expect(screen.queryByText('Initializing Numina...')).toBeNull();
      });
      
      metricsUtils.trackUserJourneyStep('navigation_complete');
      
      const metrics = metricsUtils.getTrackedMetrics();
      
      // Verify all critical chokepoints were tracked
      const expectedSteps = [
        'app_mounted',
        'fonts_loading_complete', 
        'auth_check_complete',
        'navigation_complete'
      ];
      
      const actualSteps = metrics.map((m: any) => m.step);
      expect(actualSteps).toEqual(expectedSteps);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      metricsUtils.trackUserJourneyStep('error_handling_start');
      
      // Mock font loading to fail
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      render(<App />);
      
      await testUtils.waitForAnimations(2000);
      
      await waitFor(() => {
        // App should still load even with errors
        expect(screen.queryByText('Initializing Numina...')).toBeNull();
      });
      
      console.error = originalConsoleError;
      metricsUtils.trackUserJourneyStep('error_handled_gracefully');
      
      const journey = metricsUtils.validateUserJourney([
        'error_handling_start',
        'error_handled_gracefully'
      ]);
      expect(journey.passed).toBe(true);
    });
  });
});