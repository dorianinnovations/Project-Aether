/**
 * Custom hook for managing header menu state and actions
 * Consolidates duplicate header menu logic across screens
 */

import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';

interface UseHeaderMenuOptions {
  screenName?: string;
  onSettingsPress?: () => void;
  onSignOut?: () => void;
}

export const useHeaderMenu = (options: UseHeaderMenuOptions = {}) => {
  const { screenName, onSettingsPress, onSignOut } = options;
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const navigation = useNavigation();
  const { toggleTheme } = useTheme();

  const handleMenuAction = (key: string) => {
    setShowHeaderMenu(false);
    
    switch (key) {
      case 'chat':
        if (screenName !== 'chat') {
          (navigation as any).navigate('Chat');
        }
        break;
      case 'insights':
        if (screenName !== 'insights') {
          (navigation as any).navigate('Insights');
        }
        break;
      case 'connections':
      case 'social':
        if (screenName !== 'connections') {
          (navigation as any).navigate('Connections');
        }
        break;
      case 'settings':
        onSettingsPress?.();
        break;
      case 'theme_toggle':
        toggleTheme();
        break;
      case 'sign_out':
        onSignOut?.();
        break;
      default:
        console.log('Unknown menu action:', key);
    }
  };

  const toggleHeaderMenu = () => {
    setShowHeaderMenu(!showHeaderMenu);
  };

  return {
    showHeaderMenu,
    setShowHeaderMenu,
    handleMenuAction,
    toggleHeaderMenu,
  };
};

export default useHeaderMenu;