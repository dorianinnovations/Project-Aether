/**
 * Numina Mobile App - Main Entry Point
 * Beautiful neumorphic design with sophisticated AI features
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// Removed bottom tabs - using stack navigation only
import { View, Text, StyleSheet, Dimensions } from 'react-native';

// Enhanced Components
import { Header } from './src/design-system/components/organisms';
import { LottieLoader } from './src/design-system/components/atoms';

// Screens
import HeroLandingScreen from './src/screens/HeroLandingScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import SignInScreen from './src/screens/auth/SignInScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import SocialScreen from './src/screens/connections/ConnectionsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Services
import { TokenManager } from './src/services/api';

// Contexts
import { ThemeProvider } from './src/contexts/ThemeContext';
import { SettingsProvider } from './src/contexts/SettingsContext';

// Design System
import { designTokens, getThemeColors } from './src/design-system/tokens/colors';
import { typography, fontConfig } from './src/design-system/tokens/typography';
import { spacing, borderRadius } from './src/design-system/tokens/spacing';
import { shadows } from './src/design-system/tokens/shadows';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  MainStack: undefined;
};

export type AuthStackParamList = {
  Hero: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type MainStackParamList = {
  Chat: undefined;
  Social: undefined;
  Profile: undefined;
};

// Create navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// All screens are now implemented

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Hero"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }}
    >
      <AuthStack.Screen name="Hero" component={HeroLandingScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
};

// Main Stack Navigator
const MainStackNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen name="Chat" component={ChatScreen} />
      <MainStack.Screen name="Social" component={SocialScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
    </MainStack.Navigator>
  );
};

// Loading Screen
const LoadingScreen = () => {
  const theme = 'light';
  const themeColors = getThemeColors(theme);

  return (
    <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.logoText, { color: '#5A5A5A' }]}>
        Numina
      </Text>
      <LottieLoader 
        size="large"
        style={styles.loadingSpinner}
      />
    </View>
  );
};

// Main App Component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const checkAuthStatus = async () => {
    const token = await TokenManager.getToken();
    setIsAuthenticated(!!token);
  };

  const loadFonts = async () => {
    try {
      await Font.loadAsync(fontConfig);
      setFontsLoaded(true);
    } catch (error) {
      console.error('Font loading error:', error);
      setFontsLoaded(true); // Continue with fallback fonts
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load fonts and check authentication in parallel
        await Promise.all([
          loadFonts(),
          checkAuthStatus()
        ]);

        // Simulate loading time for smooth experience
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();

    // Listen for auth state changes by checking periodically (optimized frequency)
    const authCheckInterval = setInterval(checkAuthStatus, 5000);
    
    (global as any).clearAuthState = async () => {
      await TokenManager.removeToken();
      setIsAuthenticated(false);
    };
    
    return () => clearInterval(authCheckInterval);
  }, []);

  if (isLoading || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SettingsProvider>
      <ThemeProvider>
        <NavigationContainer>
        <StatusBar style="auto" />
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress,
              },
            }),
          }}
        >
          {isAuthenticated ? (
            <RootStack.Screen name="MainStack" component={MainStackNavigator} />
          ) : (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          )}
        </RootStack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  logoText: {
    fontSize: width < 350 ? 42 : width < 400 ? 48 : 54,
    fontWeight: '700',
    letterSpacing: -4.5,
    textAlign: 'center',
    marginBottom: spacing[8],
    fontFamily: 'CrimsonPro-Bold',
  },
  loadingSpinner: {
    marginBottom: spacing[4],
  },

  // Placeholder Screens
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designTokens.brand.backgroundLight,
    paddingHorizontal: spacing[6],
    paddingBottom: 80, // Account for floating tab bar
  },
  placeholderText: {
    ...typography.textStyles.headlineLarge,
    color: designTokens.brand.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  placeholderSubtext: {
    ...typography.textStyles.bodyLarge,
    color: designTokens.text.secondary,
    textAlign: 'center',
  },
});
