import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

// Minimal test utilities without complex dependencies
const simpleRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, options);

export { simpleRender as render };
export * from '@testing-library/react-native';