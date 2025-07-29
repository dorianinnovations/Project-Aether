import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
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
  async waitForAnimations(duration = 1000) {
    // In test environment, just resolve immediately
    return Promise.resolve();
  },
};

export const metricsUtils = {
  trackUserJourneyStep(step: string, data?: any) {
    return { step, timestamp: Date.now(), data };
  },
  getTrackedMetrics() {
    return [];
  },
  clearMetrics() {
    // No-op
  },
  validateUserJourney(expectedSteps: string[]) {
    return {
      passed: true,
      expected: expectedSteps,
      actual: expectedSteps,
      metrics: [],
    };
  },
};