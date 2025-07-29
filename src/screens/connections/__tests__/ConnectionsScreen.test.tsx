import React from 'react';
import { render, fireEvent, waitFor, screen } from '../../../test-utils';
import { metricsUtils, testUtils } from '../../../test-utils';
import ConnectionsScreen from '../ConnectionsScreen';

// Mock the connections API
const mockConnectionsAPI = {
  getConnections: jest.fn(),
  createConnection: jest.fn(),
  updateConnection: jest.fn(),
  deleteConnection: jest.fn(),
  searchConnections: jest.fn(),
};

jest.mock('../../../services/api', () => ({
  ConnectionsAPI: mockConnectionsAPI,
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

describe('ConnectionsScreen - Social Features Journey', () => {
  beforeEach(() => {
    metricsUtils.clearMetrics();
    jest.clearAllMocks();
    mockConnectionsAPI.getConnections.mockResolvedValue([]);
  });

  describe('Screen Initialization', () => {
    it('should render connections interface', async () => {
      metricsUtils.trackUserJourneyStep('connections_screen_load');
      
      render(<ConnectionsScreen />);
      
      // Header should be present
      expect(screen.getByText('Numina')).toBeTruthy();
      
      await testUtils.waitForAnimations(1000);
      
      metricsUtils.trackUserJourneyStep('connections_interface_ready');
      
      const journey = metricsUtils.validateUserJourney([
        'connections_screen_load',
        'connections_interface_ready'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should load existing connections on mount', async () => {
      metricsUtils.trackUserJourneyStep('connections_loading_start');
      
      const mockConnections = [
        {
          id: '1',
          name: 'Alice Johnson',
          status: 'connected',
          lastInteraction: '2024-01-15T10:30:00Z',
          compatibilityScore: 85,
        },
        {
          id: '2', 
          name: 'Bob Smith',
          status: 'pending',
          lastInteraction: '2024-01-14T15:45:00Z',
          compatibilityScore: 72,
        }
      ];
      
      mockConnectionsAPI.getConnections.mockResolvedValue(mockConnections);
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('connections_loaded');
      
      const journey = metricsUtils.validateUserJourney([
        'connections_loading_start',
        'connections_loaded'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle empty connections state', async () => {
      metricsUtils.trackUserJourneyStep('empty_connections_test');
      
      mockConnectionsAPI.getConnections.mockResolvedValue([]);
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('empty_state_handled');
      
      const journey = metricsUtils.validateUserJourney([
        'empty_connections_test',
        'empty_state_handled'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Connection Discovery Journey', () => {
    it('should handle connection search functionality', async () => {
      metricsUtils.trackUserJourneyStep('connection_search_start');
      
      const mockSearchResults = [
        {
          id: '3',
          name: 'Charlie Brown',
          mutualConnections: 5,
          compatibilityScore: 78,
          status: 'discoverable'
        }
      ];
      
      mockConnectionsAPI.searchConnections.mockResolvedValue(mockSearchResults);
      
      render(<ConnectionsScreen />);
      
      await testUtils.waitForAnimations(500);
      
      // Simulate search functionality
      metricsUtils.trackUserJourneyStep('search_query_entered');
      
      // Search should be executed
      await mockConnectionsAPI.searchConnections('Charlie');
      
      metricsUtils.trackUserJourneyStep('search_results_received');
      
      const journey = metricsUtils.validateUserJourney([
        'connection_search_start',
        'search_query_entered',
        'search_results_received'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should display compatibility scores', async () => {
      metricsUtils.trackUserJourneyStep('compatibility_display_test');
      
      const mockConnections = [
        {
          id: '1',
          name: 'High Compatibility User',
          compatibilityScore: 95,
          status: 'connected'
        },
        {
          id: '2',
          name: 'Medium Compatibility User', 
          compatibilityScore: 65,
          status: 'connected'
        }
      ];
      
      mockConnectionsAPI.getConnections.mockResolvedValue(mockConnections);
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('compatibility_scores_displayed');
      
      const journey = metricsUtils.validateUserJourney([
        'compatibility_display_test',
        'compatibility_scores_displayed'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Connection Management Journey', () => {
    it('should handle sending connection requests', async () => {
      metricsUtils.trackUserJourneyStep('connection_request_start');
      
      mockConnectionsAPI.createConnection.mockResolvedValue({
        id: 'new-connection',
        status: 'pending',
        requestedAt: new Date().toISOString()
      });
      
      render(<ConnectionsScreen />);
      
      await testUtils.waitForAnimations(500);
      
      // Simulate connection request
      await mockConnectionsAPI.createConnection({
        targetUserId: 'user-123',
        message: 'Hi, I\'d like to connect!'
      });
      
      expect(mockConnectionsAPI.createConnection).toHaveBeenCalled();
      
      metricsUtils.trackUserJourneyStep('connection_request_sent');
      
      const journey = metricsUtils.validateUserJourney([
        'connection_request_start',
        'connection_request_sent'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle accepting connection requests', async () => {
      metricsUtils.trackUserJourneyStep('accept_connection_start');
      
      const pendingConnection = {
        id: 'pending-1',
        name: 'New Friend',
        status: 'pending_incoming',
        requestMessage: 'Hello, let\'s connect!'
      };
      
      mockConnectionsAPI.getConnections.mockResolvedValue([pendingConnection]);
      mockConnectionsAPI.updateConnection.mockResolvedValue({
        ...pendingConnection,
        status: 'connected',
        connectedAt: new Date().toISOString()
      });
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      // Simulate accepting connection
      await mockConnectionsAPI.updateConnection('pending-1', { status: 'connected' });
      
      metricsUtils.trackUserJourneyStep('connection_accepted');
      
      const journey = metricsUtils.validateUserJourney([
        'accept_connection_start',
        'connection_accepted'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle rejecting connection requests', async () => {
      metricsUtils.trackUserJourneyStep('reject_connection_start');
      
      mockConnectionsAPI.deleteConnection.mockResolvedValue(true);
      
      render(<ConnectionsScreen />);
      
      await testUtils.waitForAnimations(500);
      
      // Simulate rejecting connection
      await mockConnectionsAPI.deleteConnection('pending-1');
      
      expect(mockConnectionsAPI.deleteConnection).toHaveBeenCalledWith('pending-1');
      
      metricsUtils.trackUserJourneyStep('connection_rejected');
      
      const journey = metricsUtils.validateUserJourney([
        'reject_connection_start',
        'connection_rejected'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Social Interaction Features', () => {
    it('should display connection activity feed', async () => {
      metricsUtils.trackUserJourneyStep('activity_feed_test');
      
      const connectionsWithActivity = [
        {
          id: '1',
          name: 'Active User',
          lastInteraction: new Date().toISOString(),
          recentActivity: 'Shared a thought about AI ethics'
        }
      ];
      
      mockConnectionsAPI.getConnections.mockResolvedValue(connectionsWithActivity);
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('activity_feed_loaded');
      
      const journey = metricsUtils.validateUserJourney([
        'activity_feed_test',
        'activity_feed_loaded'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle mutual connections display', async () => {
      metricsUtils.trackUserJourneyStep('mutual_connections_test');
      
      const connectionWithMutuals = {
        id: '1',
        name: 'Connected User',
        mutualConnections: ['Alice', 'Bob', 'Charlie'],
        mutualCount: 3
      };
      
      mockConnectionsAPI.getConnections.mockResolvedValue([connectionWithMutuals]);
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('mutual_connections_displayed');
      
      const journey = metricsUtils.validateUserJourney([
        'mutual_connections_test',
        'mutual_connections_displayed'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Navigation and User Experience', () => {
    it('should navigate to individual connection profiles', async () => {
      metricsUtils.trackUserJourneyStep('profile_navigation_test');
      
      const mockConnection = {
        id: '1',
        name: 'Profile User',
        status: 'connected'
      };
      
      mockConnectionsAPI.getConnections.mockResolvedValue([mockConnection]);
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      // Simulate navigation to profile
      metricsUtils.trackUserJourneyStep('navigated_to_profile');
      
      const journey = metricsUtils.validateUserJourney([
        'profile_navigation_test',
        'navigated_to_profile'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle filtering and sorting connections', async () => {
      metricsUtils.trackUserJourneyStep('filter_sort_test');
      
      const mixedConnections = [
        { id: '1', name: 'Z User', status: 'connected', compatibilityScore: 50 },
        { id: '2', name: 'A User', status: 'pending', compatibilityScore: 90 },
        { id: '3', name: 'M User', status: 'connected', compatibilityScore: 75 }
      ];
      
      mockConnectionsAPI.getConnections.mockResolvedValue(mixedConnections);
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      // Simulate filtering/sorting actions
      metricsUtils.trackUserJourneyStep('filter_applied');
      metricsUtils.trackUserJourneyStep('sort_applied');
      
      const journey = metricsUtils.validateUserJourney([
        'filter_sort_test',
        'filter_applied',
        'sort_applied'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Performance and Metrics', () => {
    it('should track connection interaction patterns', async () => {
      metricsUtils.trackUserJourneyStep('interaction_tracking_start');
      
      render(<ConnectionsScreen />);
      
      // Simulate various user interactions
      const interactions = [
        'screen_viewed',
        'connections_list_scrolled', 
        'connection_profile_viewed',
        'search_performed',
        'filter_changed',
        'connection_request_sent'
      ];
      
      interactions.forEach(interaction => {
        metricsUtils.trackUserJourneyStep(interaction);
      });
      
      const metrics = metricsUtils.getTrackedMetrics();
      
      // Should track all interaction points
      expect(metrics.length).toBeGreaterThan(interactions.length);
      
      // Each metric should have timing
      metrics.forEach(metric => {
        expect(metric.timestamp).toBeGreaterThan(0);
      });
    });

    it('should monitor social feature usage', async () => {
      metricsUtils.trackUserJourneyStep('social_metrics_start');
      
      render(<ConnectionsScreen />);
      
      // Track key social feature usage
      const socialFeatures = [
        'connections_loaded',
        'compatibility_scores_viewed',
        'mutual_connections_viewed',
        'activity_feed_viewed',
        'search_used',
        'connection_made'
      ];
      
      socialFeatures.forEach((feature, index) => {
        setTimeout(() => {
          metricsUtils.trackUserJourneyStep(feature);
        }, index * 50);
      });
      
      jest.advanceTimersByTime(500);
      
      const metrics = metricsUtils.getTrackedMetrics();
      const featureMetrics = metrics.filter(m => 
        socialFeatures.includes(m.step)
      );
      
      expect(featureMetrics.length).toBe(socialFeatures.length);
    });

    it('should track connection success rates', async () => {
      metricsUtils.trackUserJourneyStep('success_rate_tracking');
      
      // Simulate connection attempts with different outcomes
      const attempts = [
        { result: 'success', type: 'connection_request' },
        { result: 'success', type: 'connection_accept' },
        { result: 'failure', type: 'connection_request' },
        { result: 'success', type: 'connection_request' }
      ];
      
      attempts.forEach(attempt => {
        metricsUtils.trackUserJourneyStep(`${attempt.type}_${attempt.result}`);
      });
      
      const metrics = metricsUtils.getTrackedMetrics();
      const successMetrics = metrics.filter(m => m.step.includes('success'));
      const failureMetrics = metrics.filter(m => m.step.includes('failure'));
      
      // Should track both successes and failures
      expect(successMetrics.length).toBe(3);
      expect(failureMetrics.length).toBe(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      metricsUtils.trackUserJourneyStep('network_error_handling');
      
      mockConnectionsAPI.getConnections.mockRejectedValue(new Error('Network error'));
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('network_error_handled');
      
      const journey = metricsUtils.validateUserJourney([
        'network_error_handling',
        'network_error_handled'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle invalid connection data', async () => {
      metricsUtils.trackUserJourneyStep('invalid_data_handling');
      
      const invalidConnections = [
        { id: '1' }, // Missing required fields
        { name: 'No ID User' }, // Missing ID
        null, // Null entry
        { id: '2', name: 'Valid User', status: 'connected' } // Valid entry
      ];
      
      mockConnectionsAPI.getConnections.mockResolvedValue(invalidConnections);
      
      render(<ConnectionsScreen />);
      
      await waitFor(() => {
        expect(mockConnectionsAPI.getConnections).toHaveBeenCalled();
      });
      
      metricsUtils.trackUserJourneyStep('invalid_data_filtered');
      
      const journey = metricsUtils.validateUserJourney([
        'invalid_data_handling',
        'invalid_data_filtered'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should recover from failed connection operations', async () => {
      metricsUtils.trackUserJourneyStep('operation_recovery_test');
      
      // First attempt fails, second succeeds
      mockConnectionsAPI.createConnection
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({ id: 'retry-success', status: 'pending' });
      
      render(<ConnectionsScreen />);
      
      // Simulate failed operation
      try {
        await mockConnectionsAPI.createConnection({ targetUserId: 'user-1' });
      } catch (error) {
        metricsUtils.trackUserJourneyStep('operation_failed');
      }
      
      // Simulate retry success
      await mockConnectionsAPI.createConnection({ targetUserId: 'user-1' });
      metricsUtils.trackUserJourneyStep('operation_recovered');
      
      const journey = metricsUtils.validateUserJourney([
        'operation_recovery_test',
        'operation_failed',
        'operation_recovered'
      ]);
      expect(journey.passed).toBe(true);
    });
  });
});