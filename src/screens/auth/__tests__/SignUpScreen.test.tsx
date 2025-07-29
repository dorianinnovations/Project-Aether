import React from 'react';
import { render, fireEvent, waitFor, screen } from '../../../test-utils';
import { metricsUtils, mockAPI, userJourneyHelpers, testUtils } from '../../../test-utils';
import SignUpScreen from '../SignUpScreen';

// Mock the API
jest.mock('../../../services/api', () => ({
  AuthAPI: mockAPI.auth,
  ApiUtils: {},
  TokenManager: {
    getToken: jest.fn(),
  },
}));

describe('SignUpScreen - User Registration Journey', () => {
  const mockNavigation = testUtils.createMockNavigation();
  const mockRoute = testUtils.createMockRoute();

  beforeEach(() => {
    metricsUtils.clearMetrics();
    mockAPI.reset();
    jest.clearAllMocks();
  });

  describe('Screen Initialization and Animations', () => {
    it('should render sign up form with proper elements', async () => {
      metricsUtils.trackUserJourneyStep('signup_screen_load');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      expect(screen.getByText('Sign up')).toBeTruthy();
      expect(screen.getByText(/Create your/)).toBeTruthy();
      expect(screen.getByPlaceholderText('Email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('Confirm Password')).toBeTruthy();
      expect(screen.getByText('Create Account')).toBeTruthy();
      
      await testUtils.waitForAnimations(1500);
      
      metricsUtils.trackUserJourneyStep('signup_form_rendered');
      
      const journey = metricsUtils.validateUserJourney([
        'signup_screen_load',
        'signup_form_rendered'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should display Numina branding consistently', () => {
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      expect(screen.getByText('Numina')).toBeTruthy();
      expect(screen.getByText('Sign up')).toBeTruthy();
      expect(screen.getByText(/Create your/)).toBeTruthy();
      expect(screen.getByText('Numina')).toBeTruthy(); // In subtitle
    });
  });

  describe('Form Validation Journey', () => {
    it('should validate empty form submission', async () => {
      metricsUtils.trackUserJourneyStep('empty_signup_form_test');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      const submitButton = screen.getByText('Create Account');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all fields')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('empty_form_error_shown');
      
      const journey = metricsUtils.validateUserJourney([
        'empty_signup_form_test',
        'empty_form_error_shown'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should validate email format', async () => {
      metricsUtils.trackUserJourneyStep('email_validation_test');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
      const submitButton = screen.getByText('Create Account');
      
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'TestPass123!');
      fireEvent.changeText(confirmPasswordInput, 'TestPass123!');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('email_validation_error_shown');
      
      const journey = metricsUtils.validateUserJourney([
        'email_validation_test',
        'email_validation_error_shown'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should validate password strength', async () => {
      metricsUtils.trackUserJourneyStep('password_strength_test');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      const passwordInput = screen.getByPlaceholderText('Password');
      
      // Test weak password
      fireEvent.changeText(passwordInput, 'weak');
      
      await waitFor(() => {
        expect(screen.getByText('Very Weak')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('weak_password_detected');
      
      // Test stronger password
      fireEvent.changeText(passwordInput, 'StrongPass123!');
      
      await waitFor(() => {
        expect(screen.getByText('Strong')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('strong_password_detected');
      
      const journey = metricsUtils.validateUserJourney([
        'password_strength_test',
        'weak_password_detected',
        'strong_password_detected'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should validate password confirmation match', async () => {
      metricsUtils.trackUserJourneyStep('password_match_test');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
      const submitButton = screen.getByText('Create Account');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'TestPass123!');
      fireEvent.changeText(confirmPasswordInput, 'DifferentPass123!');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('password_mismatch_detected');
      
      const journey = metricsUtils.validateUserJourney([
        'password_match_test',
        'password_mismatch_detected'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should enforce minimum password strength for submission', async () => {
      metricsUtils.trackUserJourneyStep('minimum_strength_test');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
      const submitButton = screen.getByText('Create Account');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'weak');
      fireEvent.changeText(confirmPasswordInput, 'weak');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password is too weak. Add uppercase, numbers, or symbols')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('weak_password_rejected');
      
      const journey = metricsUtils.validateUserJourney([
        'minimum_strength_test',
        'weak_password_rejected'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Registration Flow', () => {
    it('should complete successful registration journey', async () => {
      metricsUtils.trackUserJourneyStep('successful_registration_start');
      
      mockAPI.signupSuccess();
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      await userJourneyHelpers.completeSignUpFlow(screen);
      
      await waitFor(() => {
        expect(mockAPI.auth.signup).toHaveBeenCalledWith('test@example.com', 'TestPass123!');
      });
      
      // Should show success screen
      await waitFor(() => {
        expect(screen.getByText('Welcome to Numina!')).toBeTruthy();
      }, { timeout: 3000 });
      
      metricsUtils.trackUserJourneyStep('registration_success_screen');
      
      // Should navigate to main app after delay
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('MainStack');
      });
      
      metricsUtils.trackUserJourneyStep('navigated_to_main_app');
      
      const expectedSteps = [
        'successful_registration_start',
        'signup_start',
        'signup_email_entered',
        'signup_password_entered',
        'signup_confirm_password_entered',
        'signup_form_submitted',
        'registration_success_screen',
        'navigated_to_main_app'
      ];
      
      const journey = metricsUtils.validateUserJourney(expectedSteps);
      expect(journey.passed).toBe(true);
    });

    it('should handle registration errors gracefully', async () => {
      metricsUtils.trackUserJourneyStep('registration_error_test');
      
      mockAPI.signupError('Account creation failed');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      await userJourneyHelpers.completeSignUpFlow(screen);
      
      await waitFor(() => {
        expect(screen.getByText('Account creation failed')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('registration_error_shown');
      
      // Error should clear after timeout
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.queryByText('Account creation failed')).toBeNull();
      });
      
      metricsUtils.trackUserJourneyStep('registration_error_cleared');
      
      const journey = metricsUtils.validateUserJourney([
        'registration_error_test',
        'signup_start',
        'signup_email_entered',
        'signup_password_entered',
        'signup_confirm_password_entered',
        'signup_form_submitted',
        'registration_error_shown',
        'registration_error_cleared'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should show success screen with proper onboarding messaging', async () => {
      metricsUtils.trackUserJourneyStep('success_screen_test');
      
      mockAPI.signupSuccess();
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      await userJourneyHelpers.completeSignUpFlow(screen);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Numina!')).toBeTruthy();
        expect(screen.getByText('Your Numina is ready to understand and grow with you')).toBeTruthy();
        expect(screen.getByText('Starting behavioral analysis...')).toBeTruthy();
      }, { timeout: 3000 });
      
      metricsUtils.trackUserJourneyStep('success_messaging_verified');
      
      const journey = metricsUtils.validateUserJourney([
        'success_screen_test',
        'signup_start',
        'signup_email_entered',
        'signup_password_entered',
        'signup_confirm_password_entered',
        'signup_form_submitted',
        'success_messaging_verified'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Navigation and User Journey', () => {
    it('should navigate to sign in when user taps sign in link', async () => {
      metricsUtils.trackUserJourneyStep('signin_navigation_test');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      const signInLink = screen.getByText(/Already have an account/);
      fireEvent.press(signInLink);
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
      
      metricsUtils.trackUserJourneyStep('navigated_to_signin');
      
      const journey = metricsUtils.validateUserJourney([
        'signin_navigation_test',
        'navigated_to_signin'
      ]);
      expect(journey.passed).toBe(true);
    });

    it('should handle back navigation to hero screen', async () => {
      metricsUtils.trackUserJourneyStep('back_navigation_test');
      
      mockNavigation.canGoBack.mockReturnValue(false);
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      await testUtils.waitForAnimations(500);
      
      // When no back navigation available, should have fallback behavior
      expect(mockNavigation.canGoBack).toHaveBeenCalled();
      
      metricsUtils.trackUserJourneyStep('back_navigation_checked');
      
      const journey = metricsUtils.validateUserJourney([
        'back_navigation_test',
        'back_navigation_checked'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('User Experience Features', () => {
    it('should provide real-time password strength feedback', async () => {
      metricsUtils.trackUserJourneyStep('password_feedback_test');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      const passwordInput = screen.getByPlaceholderText('Password');
      
      // Test progression of password strength
      const testCases = [
        { password: 'a', expectedStrength: 'Very Weak' },
        { password: 'abc123', expectedStrength: 'Weak' },
        { password: 'Abc123', expectedStrength: 'Fair' },
        { password: 'Abc123!', expectedStrength: 'Good' },
        { password: 'StrongPass123!', expectedStrength: 'Strong' },
      ];
      
      for (const testCase of testCases) {
        fireEvent.changeText(passwordInput, testCase.password);
        
        await waitFor(() => {
          expect(screen.getByText(testCase.expectedStrength)).toBeTruthy();
        });
        
        metricsUtils.trackUserJourneyStep(`password_strength_${testCase.expectedStrength.toLowerCase().replace(' ', '_')}`);
      }
      
      const metrics = metricsUtils.getTrackedMetrics();
      expect(metrics.length).toBeGreaterThan(5); // Should have tracked all strength levels
    });

    it('should handle keyboard navigation flow', async () => {
      metricsUtils.trackUserJourneyStep('keyboard_navigation_test');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
      
      // Email -> Password
      fireEvent(emailInput, 'submitEditing');
      metricsUtils.trackUserJourneyStep('email_to_password');
      
      // Password -> Confirm Password
      fireEvent(passwordInput, 'submitEditing');
      metricsUtils.trackUserJourneyStep('password_to_confirm');
      
      // Confirm Password -> Submit
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'TestPass123!');
      fireEvent.changeText(confirmPasswordInput, 'TestPass123!');
      
      mockAPI.signupSuccess();
      fireEvent(confirmPasswordInput, 'submitEditing');
      metricsUtils.trackUserJourneyStep('confirm_to_submit');
      
      const journey = metricsUtils.validateUserJourney([
        'keyboard_navigation_test',
        'email_to_password',
        'password_to_confirm',
        'confirm_to_submit'
      ]);
      expect(journey.passed).toBe(true);
    });
  });

  describe('Performance and Metrics Tracking', () => {
    it('should track all critical user journey chokepoints', async () => {
      metricsUtils.trackUserJourneyStep('comprehensive_metrics_test');
      
      mockAPI.signupSuccess();
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      metricsUtils.trackUserJourneyStep('screen_loaded');
      
      // Complete registration flow with detailed tracking
      await userJourneyHelpers.completeSignUpFlow(screen);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Numina!')).toBeTruthy();
      }, { timeout: 3000 });
      
      metricsUtils.trackUserJourneyStep('registration_complete');
      
      const metrics = metricsUtils.getTrackedMetrics();
      
      // Verify all critical chokepoints were captured
      const criticalSteps = [
        'comprehensive_metrics_test',
        'screen_loaded',
        'signup_start',
        'signup_email_entered',
        'signup_password_entered',
        'signup_confirm_password_entered',
        'signup_form_submitted',
        'registration_complete'
      ];
      
      const actualSteps = metrics.map(m => m.step);
      expect(actualSteps).toEqual(criticalSteps);
      
      // Each metric should have timestamp and proper structure
      metrics.forEach(metric => {
        expect(metric).toHaveProperty('step');
        expect(metric).toHaveProperty('timestamp');
        expect(typeof metric.timestamp).toBe('number');
        expect(metric.timestamp).toBeGreaterThan(0);
      });
    });

    it('should measure registration completion time', async () => {
      const startTime = Date.now();
      metricsUtils.trackUserJourneyStep('registration_timing_start', { startTime });
      
      mockAPI.signupSuccess();
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      await userJourneyHelpers.completeSignUpFlow(screen);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Numina!')).toBeTruthy();
      }, { timeout: 3000 });
      
      const endTime = Date.now();
      const completionTime = endTime - startTime;
      
      metricsUtils.trackUserJourneyStep('registration_timing_complete', { 
        endTime, 
        completionTime 
      });
      
      // Registration should complete within reasonable time
      expect(completionTime).toBeLessThan(5000);
      
      const metrics = metricsUtils.getTrackedMetrics();
      const timingMetrics = metrics.filter(m => m.data);
      expect(timingMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should allow users to retry after errors', async () => {
      metricsUtils.trackUserJourneyStep('error_recovery_test');
      
      // First attempt fails
      mockAPI.signupError('Server error');
      
      render(<SignUpScreen navigation={mockNavigation} route={mockRoute} />);
      
      await userJourneyHelpers.completeSignUpFlow(screen);
      
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeTruthy();
      });
      
      metricsUtils.trackUserJourneyStep('first_attempt_failed');
      
      // Error clears after timeout
      jest.advanceTimersByTime(3000);
      
      // Second attempt succeeds
      mockAPI.signupSuccess();
      
      const submitButton = screen.getByText('Create Account');
      fireEvent.press(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to Numina!')).toBeTruthy();
      }, { timeout: 3000 });
      
      metricsUtils.trackUserJourneyStep('retry_succeeded');
      
      const journey = metricsUtils.validateUserJourney([
        'error_recovery_test',
        'signup_start',
        'signup_email_entered',
        'signup_password_entered',
        'signup_confirm_password_entered',
        'signup_form_submitted',
        'first_attempt_failed',
        'retry_succeeded'
      ]);
      expect(journey.passed).toBe(true);
    });
  });
});