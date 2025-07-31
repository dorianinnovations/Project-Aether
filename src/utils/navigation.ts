// Navigation utilities

import { NavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Chat: undefined;
  Profile: undefined;
  Social: undefined;
  Dashboard: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type NavigationProps = NavigationProp<RootStackParamList>;

export const navigateToScreen = (
  navigation: NavigationProps,
  screenName: keyof RootStackParamList
): void => {
  navigation.navigate(screenName);
};

export const goBack = (navigation: NavigationProps): void => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  }
};

export const resetToScreen = (
  navigation: NavigationProps,
  screenName: keyof RootStackParamList
): void => {
  navigation.reset({
    index: 0,
    routes: [{ name: screenName }],
  });
};