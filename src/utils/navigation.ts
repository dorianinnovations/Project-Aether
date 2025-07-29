/**
 * Navigation Utilities
 * Safe navigation helpers to prevent "GO_BACK" action errors
 */

export const safeGoBack = (
  navigation: any,
  fallbackAction?: () => void
): void => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else if (fallbackAction) {
    fallbackAction();
  } else {
    console.warn('safeGoBack: No previous screen to go back to and no fallback provided');
  }
};

export const safeNavigateBack = (
  navigation: any,
  onNavigateBack?: () => void,
  onNavigateToHero?: () => void
): void => {
  if (onNavigateBack) {
    onNavigateBack();
  } else if (navigation.canGoBack()) {
    navigation.goBack();
  } else if (onNavigateToHero) {
    onNavigateToHero();
  } else {
    console.warn('safeNavigateBack: No back handler, previous screen, or hero navigation provided');
  }
};