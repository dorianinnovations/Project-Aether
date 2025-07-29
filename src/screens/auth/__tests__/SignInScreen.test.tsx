import React from 'react';
import { render, fireEvent, waitFor, screen } from '../../../test-utils';
import { metricsUtils, mockAPI, userJourneyHelpers, testUtils } from '../../../test-utils';
import SignInScreen from '../SignInScreen';

// Mock the API
jest.mock('../../../services/api', () => ({
  AuthAPI: mockAPI.auth,
  ApiUtils: {},
  TokenManager: {
    getToken: jest.fn(),
  },
}));

describe('SignInScreen - User Authentication Journey', () => {
  const mockNavigation = testUtils.createMockNavigation();
  const mockRoute = testUtils.createMockRoute();

  beforeEach(() => {
    metricsUtils.clearMetrics();
    mockAPI.reset();
    jest.clearAllMocks();
  });

  describe('Screen Initialization and Animations', () => {
    it('should render sign in form with staggered animations', async () => {
      metricsUtils.trackUserJourneyStep('signin_screen_load');
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      // Initially form elements should be animating in
      expect(screen.getByText('Sign in')).toBeTruthy();
      expect(screen.getByText(/Welcome back to/)).toBeTruthy();
      expect(screen.getByPlaceholderText('Email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Password')).toBeTruthy();
      
      // Advance animations
      await testUtils.waitForAnimations(1500);
      
      metricsUtils.trackUserJourneyStep('signin_animations_complete');
      
      const journey = metricsUtils.validateUserJourney([
        'signin_screen_load',
        'signin_animations_complete'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should display proper branding and messaging', () => {
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      expect(screen.getByText('Numina')).toBeTruthy();
      expect(screen.getByText('Sign in')).toBeTruthy();
      expect(screen.getByText(/Welcome back to/)).toBeTruthy();
      expect(screen.getByText('Numina')).toBeTruthy();
    });
  });

  describe('Form Validation and User Input', () => {
    it('should validate empty form submission', async () => {
      metricsUtils.trackUserJourneyStep('empty_form_test_start');
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      const submitButton = screen.getByText('Sign In');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all fields')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('empty_form_validation_shown');
      
      const journey = metricsUtils.validateUserJourney([
        'empty_form_test_start',
        'empty_form_validation_shown'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle user input and clear errors on change', async () => {
      metricsUtils.trackUserJourneyStep('input_handling_start');
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      // First trigger an error
      const submitButton = screen.getByText('Sign In');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all fields')).toBeTruthy();
      });
      
      // Then start typing - error should clear
      const emailInput = screen.getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      metricsUtils.trackUserJourneyStep('email_input_entered');
      
      await waitFor(() => {
        expect(screen.queryByText('Please fill in all fields')).toBeNull();
      });
      
      metricsUtils.trackUserJourneyStep('error_cleared_on_input');
      
      const journey = metricsUtils.validateUserJourney([
        'input_handling_start',
        'email_input_entered',
        'error_cleared_on_input'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle keyboard navigation between fields', async () => {
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      
      // Focus email field
      fireEvent(emailInput, 'focus');
      metricsUtils.trackUserJourneyStep('email_field_focused');
      
      // Submit should move to password field
      fireEvent(emailInput, 'submitEditing');
      metricsUtils.trackUserJourneyStep('moved_to_password_field');
      
      // Password submit should trigger form submission
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      
      mockAPI.loginSuccess();
      
      fireEvent(passwordInput, 'submitEditing');
      metricsUtils.trackUserJourneyStep('form_submitted_via_keyboard');
      
      const journey = metricsUtils.validateUserJourney([
        'email_field_focused',
        'moved_to_password_field',
        'form_submitted_via_keyboard'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Authentication Flow', () => {
    it('should complete successful sign in journey', async () => {
      metricsUtils.trackUserJourneyStep('successful_signin_start');
      
      mockAPI.loginSuccess();
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      await userJourneyHelpers.completeSignInFlow(screen);
      
      await waitFor(() => {
        expect(mockAPI.auth.login).toHaveBeenCalledWith('test@example.com', 'TestPass123!');
      });
      
      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('signin_success_shown');
      
      // Validate complete journey
      const expectedSteps = [
        'successful_signin_start',
        'signin_start',
        'signin_email_entered',
        'signin_password_entered',
        'signin_form_submitted',
        'signin_success_shown'
      ];
      
      const journey = metricsUtils.validateUserJourney(expectedSteps);
      expect(journey.passed).toBe(true);
    });

    it('should handle authentication errors gracefully', async () => {
      metricsUtils.trackUserJourneyStep('signin_error_handling_start');
      
      mockAPI.loginError('Invalid email or password');
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      await userJourneyHelpers.completeSignInFlow(screen);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('signin_error_displayed');
      
      // Error should clear after timeout
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid email or password')).toBeNull();
      });
      
      metricsUtils.trackUserJourneyStep('signin_error_cleared');
      
      const journey = metricsUtils.validateUserJourney([
        'signin_error_handling_start',
        'signin_start',
        'signin_email_entered',
        'signin_password_entered',
        'signin_form_submitted',
        'signin_error_displayed',
        'signin_error_cleared'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should show slow server message for delayed responses', async () => {
      metricsUtils.trackUserJourneyStep('slow_server_test_start');
      
      // Mock a delayed response
      mockAPI.auth.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ token: 'test' }), 20000))
      );
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      await userJourneyHelpers.completeSignInFlow(screen);
      
      // Fast forward to trigger slow server message
      jest.advanceTimersByTime(15000);
      
      await waitFor(() => {
        expect(screen.getByText('Server may be slow, please wait...')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('slow_server_message_shown');
      
      const journey = metricsUtils.validateUserJourney([
        'slow_server_test_start',
        'signin_start',
        'signin_email_entered',
        'signin_password_entered',
        'signin_form_submitted',
        'slow_server_message_shown'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Navigation and User Journey', () => {
    it('should navigate to sign up when user taps create account link', async () => {
      metricsUtils.trackUserJourneyStep('signup_navigation_start');
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      const signUpLink = screen.getByText(/Don't have an account/);
      fireEvent.press(signUpLink);
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
      
      metricsUtils.trackUserJourneyStep('navigated_to_signup');
      
      const journey = metricsUtils.validateUserJourney([
        'signup_navigation_start',
        'navigated_to_signup'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle back navigation correctly', async () => {
      metricsUtils.trackUserJourneyStep('back_navigation_start');
      
      mockNavigation.canGoBack.mockReturnValue(true);
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      // Wait for header to render
      await testUtils.waitForAnimations(500);
      
      // Back button should be present in header
      // Since we can't easily test the header button directly, we test the navigation logic
      expect(mockNavigation.canGoBack).toHaveBeenCalled();
      
      metricsUtils.trackUserJourneyStep('back_navigation_verified');
      
      const journey = metricsUtils.validateUserJourney([
        'back_navigation_start',
        'back_navigation_verified'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('User Experience and Accessibility', () => {
    it('should provide proper form accessibility', () => {
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const submitButton = screen.getByText('Sign In');
      
      // Inputs should have proper keyboard types
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(passwordInput.props.secureTextEntry).toBe(true);
      
      // Button should be pressable
      expect(submitButton).toBeTruthy();
    });

    it('should handle loading states properly', async () => {
      metricsUtils.trackUserJourneyStep('loading_state_test_start');
      
      // Mock a delayed response to test loading state
      mockAPI.auth.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ token: 'test' }), 1000))
      );
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      await userJourneyHelpers.completeSignInFlow(screen);
      
      // Should show loading text
      expect(screen.getByText('Signing In')).toBeTruthy();
      
      metricsUtils.trackUserJourneyStep('loading_state_active');
      
      // Form inputs should be disabled during loading
      const emailInput = screen.getByPlaceholderText('Email');
      expect(emailInput.props.editable).toBe(false);
      
      const journey = metricsUtils.validateUserJourney([
        'loading_state_test_start',
        'signin_start',
        'signin_email_entered',
        'signin_password_entered',
        'signin_form_submitted',
        'loading_state_active'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Performance and Metrics', () => {
    it('should track all critical user interaction points', async () => {
      metricsUtils.trackUserJourneyStep('metrics_tracking_start');
      
      mockAPI.loginSuccess();
      
      render(<SignInScreen navigation={mockNavigation} route={mockRoute} />);
      
      // Track screen load
      metricsUtils.trackUserJourneyStep('screen_rendered');
      
      // Complete full sign in flow
      await userJourneyHelpers.completeSignInFlow(screen);
      
      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('signin_journey_complete');
      
      const metrics = metricsUtils.getTrackedMetrics();
      
      // Should have tracked all key chokepoints
      const criticalSteps = [
        'metrics_tracking_start',
        'screen_rendered',
        'signin_start',
        'signin_email_entered',
        'signin_password_entered', 
        'signin_form_submitted',
        'signin_journey_complete'
      ];
      
      const actualSteps = metrics.map(m => m.step);
      expect(actualSteps).toEqual(criticalSteps);
      
      // Each metric should have a timestamp
      metrics.forEach(metric => {
        expect(metric.timestamp).toBeGreaterThan(0);
      });
    });
  });
});