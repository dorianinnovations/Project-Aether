// Keyboard visibility hook

import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

interface KeyboardInfo {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

export const useKeyboard = (): KeyboardInfo => {
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    isKeyboardVisible: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      (event: KeyboardEvent) => {
        setKeyboardInfo({
          isKeyboardVisible: true,
          keyboardHeight: event.endCoordinates.height,
        });
      }
    );

    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardInfo({
          isKeyboardVisible: false,
          keyboardHeight: 0,
        });
      }
    );

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  return keyboardInfo;
};