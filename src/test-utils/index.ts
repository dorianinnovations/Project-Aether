import React from 'react';
import { render, RenderOptions, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(View, { testID: 'test-wrapper' }, children);
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };

export const testUtils = {
  createMockNavigation() {
    return {
      navigate: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(() => true),
      replace: jest.fn(),
    };
  },
  createMockRoute() {
    return {
      key: 'test-route-key',
      name: 'TestRoute',
      params: {},
    };
  },
  async waitForAnimations(duration = 1000) {
    // In test environment, just resolve immediately
    return Promise.resolve();
  },
};

// Track metrics in memory for testing
let trackedMetrics: Array<{ step: string; timestamp: number; data?: any }> = [];

export const metricsUtils = {
  trackUserJourneyStep(step: string, data?: any) {
    const metric = { step, timestamp: Date.now(), data };
    trackedMetrics.push(metric);
    return metric;
  },
  getTrackedMetrics() {
    return trackedMetrics;
  },
  clearMetrics() {
    trackedMetrics = [];
  },
  validateUserJourney(expectedSteps: string[]) {
    const actualSteps = trackedMetrics.map(m => m.step);
    return {
      passed: JSON.stringify(actualSteps) === JSON.stringify(expectedSteps),
      expected: expectedSteps,
      actual: actualSteps,
      metrics: trackedMetrics,
    };
  },
};

export const mockAPI = {
  auth: {
    login: jest.fn(),
    signup: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  reset() {
    this.auth.login.mockReset();
    this.auth.signup.mockReset();
    this.auth.signIn.mockReset();
    this.auth.signUp.mockReset();
    this.auth.signOut.mockReset();
  },
  loginSuccess() {
    this.auth.login.mockResolvedValue({ token: 'mock-token', user: { id: '1', email: 'test@example.com' } });
  },
  loginError(message: string) {
    this.auth.login.mockRejectedValue(new Error(message));
  },
  signupSuccess() {
    this.auth.signup.mockResolvedValue({ token: 'mock-token', user: { id: '1', email: 'test@example.com' } });
  },
  signupError(message: string) {
    this.auth.signup.mockRejectedValue(new Error(message));
  },
};

export const userJourneyHelpers = {
  async completeSignInFlow(screen: any) {
    metricsUtils.trackUserJourneyStep('signin_start');
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign In');
    
    // Fill form
    fireEvent.changeText(emailInput, 'test@example.com');
    metricsUtils.trackUserJourneyStep('signin_email_entered');
    
    fireEvent.changeText(passwordInput, 'TestPass123!');
    metricsUtils.trackUserJourneyStep('signin_password_entered');
    
    // Submit form
    fireEvent.press(submitButton);
    metricsUtils.trackUserJourneyStep('signin_form_submitted');
  },
  
  async completeSignUpFlow(screen: any) {
    metricsUtils.trackUserJourneyStep('signup_start');
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByText('Create Account');
    
    // Fill form
    fireEvent.changeText(emailInput, 'test@example.com');
    metricsUtils.trackUserJourneyStep('signup_email_entered');
    
    fireEvent.changeText(passwordInput, 'TestPass123!');
    metricsUtils.trackUserJourneyStep('signup_password_entered');
    
    fireEvent.changeText(confirmPasswordInput, 'TestPass123!');
    metricsUtils.trackUserJourneyStep('signup_confirm_password_entered');
    
    // Submit form
    fireEvent.press(submitButton);
    metricsUtils.trackUserJourneyStep('signup_form_submitted');
  },
  
  simulateUserFlow(steps: string[]) {
    // Simulate a user journey through given steps
    return steps.map(step => ({ step, timestamp: Date.now() }));
  },
  
  trackConversion(event: string, data?: any) {
    // Track conversion event
    return { event, timestamp: Date.now(), data };
  },
};