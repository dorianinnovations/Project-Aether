/**
 * Aether Design System - Spacing Tokens
 * Harmonious 4px base unit system for consistent layouts
 */

export const spacing = {
  // Base 4px unit system (perfectly scalable)
  0: 0,     // No spacing
  1: 4,     // 4px - Tight spacing
  2: 8,     // 8px - Close spacing  
  3: 12,    // 12px - Compact spacing
  4: 16,    // 16px - Default spacing
  5: 20,    // 20px - Comfortable spacing
  6: 24,    // 24px - Generous spacing
  8: 32,    // 32px - Large spacing
  10: 40,   // 40px - Extra large spacing
  12: 48,   // 48px - Section spacing
  16: 64,   // 64px - Page section spacing
  20: 80,   // 80px - Hero spacing
  24: 96,   // 96px - Large hero spacing
  32: 128,  // 128px - Maximum spacing
};

// Semantic spacing values for common use cases
export const semanticSpacing = {
  // Component Internal Spacing
  componentPadding: {
    xs: spacing[2],      // 8px - Tight components (chips, tags)
    sm: spacing[3],      // 12px - Small components (buttons)
    md: spacing[4],      // 16px - Medium components (cards)
    lg: spacing[6],      // 24px - Large components (modals)
    xl: spacing[8],      // 32px - Extra large components
  },
  
  // Layout Spacing
  layout: {
    screenPadding: spacing[4],    // 16px - Screen edge padding
    sectionGap: spacing[6],       // 24px - Between sections
    cardGap: spacing[4],          // 16px - Between cards
    listItemGap: spacing[3],      // 12px - Between list items
    headerHeight: spacing[16],     // 64px - Header height
    tabHeight: spacing[12],       // 48px - Tab bar height
  },
  
  // Form Element Spacing
  form: {
    fieldGap: spacing[4],         // 16px - Between form fields
    labelGap: spacing[2],         // 8px - Label to input gap
    buttonGap: spacing[3],        // 12px - Between buttons
    groupGap: spacing[6],         // 24px - Between form groups
  },
  
  // Chat/Message Spacing
  chat: {
    messagePadding: spacing[4],   // 16px - Inside message bubbles
    messageGap: spacing[2],       // 8px - Between messages
    bubbleGap: spacing[3],        // 12px - Between message groups
    avatarGap: spacing[3],        // 12px - Avatar to message gap
  },
  
  // Connection/Social Spacing
  social: {
    profilePadding: spacing[5],   // 20px - Profile card padding
    connectionGap: spacing[4],    // 16px - Between connections
    compatibilityGap: spacing[3], // 12px - Compatibility elements
    eventPadding: spacing[4],     // 16px - Event card padding
  },
  
  // Analytics/Insights Spacing
  analytics: {
    metricPadding: spacing[5],    // 20px - Metric card padding
    chartGap: spacing[4],         // 16px - Between chart elements
    insightGap: spacing[3],       // 12px - Between insights
    dashboardGap: spacing[6],     // 24px - Dashboard sections
  }
};

// Border radius system (also based on 4px units)
export const borderRadius = {
  none: 0,
  xs: 2,      // 2px - Subtle radius
  sm: 4,      // 4px - Small radius
  md: 10,     // 10px - Default radius (updated standard)
  lg: 12,     // 12px - Large radius  
  xl: 16,     // 16px - Extra large radius
  '2xl': 24,  // 24px - Very large radius
  full: 9999, // Full circle/pill shape
};

// Neumorphic-specific spacing values
export const neumorphicSpacing = {
  // Shadow offsets for neumorphic effects
  shadowOffset: {
    subtle: 2,    // 2px - Subtle elevation
    default: 4,   // 4px - Default elevation
    elevated: 8,  // 8px - High elevation
    floating: 12, // 12px - Floating elements
  },
  
  // Inset depths for pressed/sunken effects
  insetDepth: {
    shallow: 2,   // 2px - Subtle inset
    default: 4,   // 4px - Default pressed state
    deep: 6,      // 6px - Deep pressed state
  },
  
  // Border widths for neumorphic elements
  borderWidth: {
    hairline: 0.5,  // Hairline border
    thin: 1,        // Thin border
    default: 2,     // Default border
    thick: 4,       // Thick border
  }
};

// Responsive spacing multipliers
export const responsiveMultipliers = {
  mobile: 1,      // Base multiplier for mobile
  tablet: 1.25,   // 25% larger on tablets
  desktop: 1.5,   // 50% larger on desktop
};

// Utility functions
export const getSpacing = (...values: (keyof typeof spacing)[]) => {
  return values.map(value => spacing[value]);
};

export const getResponsiveSpacing = (
  value: keyof typeof spacing,
  multiplier: number = responsiveMultipliers.mobile
) => {
  return spacing[value] * multiplier;
};

// Helper for creating consistent margins and padding
export const createSpacingStyle = (
  top?: keyof typeof spacing,
  right?: keyof typeof spacing,
  bottom?: keyof typeof spacing,
  left?: keyof typeof spacing
) => {
  const styles: any = {};
  
  if (top !== undefined) styles.marginTop = spacing[top];
  if (right !== undefined) styles.marginRight = spacing[right];
  if (bottom !== undefined) styles.marginBottom = spacing[bottom];
  if (left !== undefined) styles.marginLeft = spacing[left];
  
  return styles;
};

export const createPaddingStyle = (
  top?: keyof typeof spacing,
  right?: keyof typeof spacing,
  bottom?: keyof typeof spacing,
  left?: keyof typeof spacing
) => {
  const styles: any = {};
  
  if (top !== undefined) styles.paddingTop = spacing[top];
  if (right !== undefined) styles.paddingRight = spacing[right];
  if (bottom !== undefined) styles.paddingBottom = spacing[bottom];
  if (left !== undefined) styles.paddingLeft = spacing[left];
  
  return styles;
};

export default spacing;