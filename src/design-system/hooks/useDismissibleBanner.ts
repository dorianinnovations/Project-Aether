/**
 * Hook for managing dismissible banner state
 */

import React, { useState, useCallback, useRef } from 'react';

export interface UseDismissibleBannerOptions {
  /** Initial visibility state */
  initialVisible?: boolean;
  /** Auto-show after a delay */
  autoShow?: boolean;
  autoShowDelay?: number;
  /** Auto-hide after being shown */
  autoHide?: boolean;
  autoHideDelay?: number;
  /** Callback when banner is shown */
  onShow?: () => void;
  /** Callback when banner is hidden */
  onHide?: () => void;
}

export interface UseDismissibleBannerReturn {
  /** Current visibility state */
  visible: boolean;
  /** Show the banner */
  show: () => void;
  /** Hide the banner */
  hide: () => void;
  /** Toggle visibility */
  toggle: () => void;
  /** Reset to initial state */
  reset: () => void;
}

export const useDismissibleBanner = (
  options: UseDismissibleBannerOptions = {}
): UseDismissibleBannerReturn => {
  const {
    initialVisible = false,
    autoShow = false,
    autoShowDelay = 1000,
    autoHide = false,
    autoHideDelay = 5000,
    onShow,
    onHide,
  } = options;

  const [visible, setVisible] = useState(initialVisible);
  const timeouts = useRef<{
    show?: NodeJS.Timeout;
    hide?: NodeJS.Timeout;
  }>({});

  const clearTimeouts = useCallback(() => {
    if (timeouts.current.show) {
      clearTimeout(timeouts.current.show);
      timeouts.current.show = undefined;
    }
    if (timeouts.current.hide) {
      clearTimeout(timeouts.current.hide);
      timeouts.current.hide = undefined;
    }
  }, []);

  const show = useCallback(() => {
    clearTimeouts();
    setVisible(true);
    onShow?.();

    if (autoHide) {
      timeouts.current.hide = setTimeout(() => {
        hide();
      }, autoHideDelay);
    }
  }, [autoHide, autoHideDelay, onShow]);

  const hide = useCallback(() => {
    clearTimeouts();
    setVisible(false);
    onHide?.();
  }, [onHide]);

  const toggle = useCallback(() => {
    if (visible) {
      hide();
    } else {
      show();
    }
  }, [visible, show, hide]);

  const reset = useCallback(() => {
    clearTimeouts();
    setVisible(initialVisible);

    if (autoShow && !initialVisible) {
      timeouts.current.show = setTimeout(() => {
        show();
      }, autoShowDelay);
    }
  }, [initialVisible, autoShow, autoShowDelay, show]);

  // Auto-show on mount if enabled
  React.useEffect(() => {
    if (autoShow && !initialVisible) {
      timeouts.current.show = setTimeout(() => {
        show();
      }, autoShowDelay);
    }

    return () => {
      clearTimeouts();
    };
  }, []);

  return {
    visible,
    show,
    hide,
    toggle,
    reset,
  };
};