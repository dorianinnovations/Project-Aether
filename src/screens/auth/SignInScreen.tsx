/**
 * Numina - Sign In Screen
 * Numina-style elegant authentication with glassmorphic design and sophisticated animations
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { AnimatedAuthStatus } from '../../design-system/components/atoms/AnimatedAuthStatus';
import { ShimmerText } from '../../design-system/components/atoms/ShimmerText';
import { Header, HeaderMenu } from '../../design-system/components/organisms';
import { designTokens, getThemeColors } from '../../design-system/tokens/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { AuthAPI, ApiUtils } from '../../services/api';
import { goBack } from '../../utils/navigation';

const { height } = Dimensions.get('window');

interface SignInScreenProps {
  navigation: any;
  route: any;
}

const SignInScreen: React.FC<SignInScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme, colors, toggleTheme } = useTheme();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [isSignInSuccess, setIsSignInSuccess] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showSlowServerMessage, setShowSlowServerMessage] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  
  // Rainbow pastel colors for success shimmer text
  const rainbowPastels = ['#FF8FA3', '#FFB84D', '#FFD23F', '#4ECDC4', '#C77DFF', '#FF6B9D'];
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  
  // Use either auth loading or local loading
  const loading = localLoading;

  const themeColors = getThemeColors(theme);

  // Animation refs - Staggered load-in animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const linkOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonGlowAnim = useRef(new Animated.Value(0)).current;
  const emailInputScaleAnim = useRef(new Animated.Value(1)).current;
  const passwordInputScaleAnim = useRef(new Animated.Value(1)).current;
  const headerOpacityAnim = useRef(new Animated.Value(1)).current;
  const cardTranslateYAnim = useRef(new Animated.Value(0)).current;
  
  // Input refs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Staggered load-in sequence
    const animateSequence = () => {
      // Title first (200ms delay)
      setTimeout(() => {
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 200);

      // Form second (500ms delay)
      setTimeout(() => {
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 500);

      // Button third (800ms delay)
      setTimeout(() => {
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
        // Start minimal glow animation after button appears
        const glowAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(buttonGlowAnim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(buttonGlowAnim, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: true,
            }),
          ])
        );
        glowAnimation.start();
      }, 800);

      // Link last (1100ms delay)
      setTimeout(() => {
        Animated.timing(linkOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 1100);
    };

    animateSequence();
    
    // Set legacy animations for compatibility
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    slideAnim.setValue(0);
    
    return () => {
      // Cleanup on unmount
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  // Cycle through rainbow colors faster for success state
  useEffect(() => {
    if (isSignInSuccess) {
      const colorCycleInterval = setInterval(() => {
        setCurrentColorIndex((prev) => (prev + 1) % rainbowPastels.length);
      }, 800); // Faster cycling for success state
      
      return () => clearInterval(colorCycleInterval);
    }
  }, [isSignInSuccess, rainbowPastels.length]);

  const clearErrorOnChange = () => {
    if (error) {
      setError('');
      setAuthStatus('idle');
    }
  };

  const handleSubmit = async () => {
    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setError('');
    setLocalLoading(true);
    setIsSignInSuccess(false);
    setAuthStatus('loading');
    setShowSlowServerMessage(false);

    // Start 15-second timeout for slow server message
    const timeout = setTimeout(() => {
      if (localLoading) {
        setShowSlowServerMessage(true);
      }
    }, 15000);
    setTimeoutId(timeout);

    // Ultra-smooth button press animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.92,
          duration: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 1.05,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    try {
      const response = await AuthAPI.login(email.trim(), password);

      if (response) { // Assuming successful response
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setIsSignInSuccess(true);
        setAuthStatus('success');
        
        // Small delay to ensure auth state change is fully processed before navigation
        // No manual navigation needed - App.tsx auth check will handle navigation automatically
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Set user-friendly error message
        const errorMessage = 'Invalid email or password';
        setError(errorMessage);
        setIsSignInSuccess(false);
        setAuthStatus('error');
        
        // Clear error status after showing it
        setTimeout(() => {
          setAuthStatus('idle');
        }, 3000);
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Set graceful error message for unexpected errors
      const errorMessage = err.message || 'Connection failed';
      setError(errorMessage);
      setIsSignInSuccess(false);
      setAuthStatus('error');
      
      // Clear error status after showing it
      setTimeout(() => {
        setAuthStatus('idle');
      }, 3000);
    } finally {
      setLocalLoading(false);
      setShowSlowServerMessage(false);
      
      // Clear timeout when request completes
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  };

  // Static minimal glow color for Sign In button
  const getMinimalGlowColor = () => {
    return theme === 'dark' 
      ? 'rgba(173, 213, 250, 0.15)'  // Very subtle light blue glow in dark mode
      : 'rgba(26, 26, 26, 0.08)';    // Extremely subtle dark glow in light mode
  };

  // Header menu action handler
  const handleMenuAction = (key: string) => {
    setShowHeaderMenu(false);
    
    switch (key) {
      case 'chat':
      case 'insights':
      case 'connections':
        // These screens require authentication - show message or redirect to sign in
        alert('Please sign in to access this feature');
        break;
      case 'settings':
        // Settings can be accessed from auth screens
        // Add settings navigation if needed
        break;
      case 'theme_toggle':
        toggleTheme();
        break;
      default:
        break;
    }
  };

  return (
    <PageBackground theme={theme} variant="auth">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
      
      {/* Header */}
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacityAnim }]}>
        <Header 
          title="Numina"
          showBackButton={true}
          showMenuButton={true}
          onBackPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              // If no previous screen, navigate to SignUp as an alternative
              navigation.navigate('SignUp');
            }
          }}
          onTitlePress={undefined}
          onMenuPress={() => setShowHeaderMenu(!showHeaderMenu)}
          theme={theme}
          isMenuOpen={showHeaderMenu}
        />
      </Animated.View>

      {/* Header Menu */}
      <HeaderMenu
        visible={showHeaderMenu}
        onClose={() => setShowHeaderMenu(false)}
        onAction={handleMenuAction}
        showAuthOptions={false}
        
        
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateX: slideAnim },
                    { scale: scaleAnim },
                    { translateY: cardTranslateYAnim },
                  ],
                },
              ]}
            >
              {/* Neumorphic form container */}
              <View style={styles.formWrapper}>
                <View style={[
                  styles.formContainer, 
                  theme === 'dark' ? {
                    backgroundColor: '#151515',
                    borderColor: '#333333',
                    borderWidth: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                  } : styles.glassmorphic
                ]}>
                  {/* Header */}
                  <Animated.View style={[styles.header, { opacity: titleOpacity }]}>
                    <Animated.Text
                      style={[
                        styles.title,
                        {
                          color: theme === 'dark' ? '#ffffff' : '#1a1a1abf',
                          transform: [{ 
                            translateX: slideAnim.interpolate({
                              inputRange: [-30, 0],
                              outputRange: [-15, 0],
                            }) 
                          }],
                        },
                      ]}
                    >
                      Sign in
                    </Animated.Text>
                    <Text style={[
                      styles.subtitle, 
                      { 
                        color: theme === 'dark' ? '#ffffff' : '#4a4a4a',
                        marginBottom: 8
                      }
                    ]}>
                      Welcome back to{' '}
                      <Text style={styles.subtitleBold}>
                        Numina
                      </Text>
                    </Text>
                  </Animated.View>

                  {/* Form Content */}
                  <Animated.View style={[styles.formContent, { opacity: formOpacity }]}>
                    {/* Input fields */}
                    <View style={styles.inputGroup}>
                      <Animated.View style={{ transform: [{ scale: emailInputScaleAnim }] }}>
                        <TextInput
                          ref={emailInputRef}
                          style={[
                            styles.input,
                            { 
                              color: theme === 'dark' ? '#ffffff' : '#000000',
                              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                              shadowColor: theme === 'dark' ? '#000000' : '#000000',
                              shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 1 },
                              shadowOpacity: theme === 'dark' ? 0.5 : 0.12,
                              shadowRadius: theme === 'dark' ? 12 : 3,
                              elevation: theme === 'dark' ? 6 : 3,
                            }
                          ]}
                          placeholder="Email"
                          placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            clearErrorOnChange();
                          }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          keyboardType="email-address"
                          keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                          returnKeyType="next"
                          editable={!loading}
                          onSubmitEditing={() => passwordInputRef.current?.focus()}
                          onFocus={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Animated.parallel([
                              Animated.spring(emailInputScaleAnim, {
                                toValue: 1.02,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 0,
                                duration: 150,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: -0.08 * height,
                                duration: 400,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                          onBlur={() => {
                            Animated.parallel([
                              Animated.spring(emailInputScaleAnim, {
                                toValue: 1,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 1,
                                duration: 200,
                                easing: Easing.in(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: 0,
                                duration: 350,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                        />
                      </Animated.View>
                      <Animated.View style={{ transform: [{ scale: passwordInputScaleAnim }] }}>
                        <TextInput
                          ref={passwordInputRef}
                          style={[
                            styles.input,
                            { 
                              color: theme === 'dark' ? '#ffffff' : '#000000',
                              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                              shadowColor: theme === 'dark' ? '#000000' : '#000000',
                              shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 1 },
                              shadowOpacity: theme === 'dark' ? 0.5 : 0.12,
                              shadowRadius: theme === 'dark' ? 12 : 3,
                              elevation: theme === 'dark' ? 6 : 3,
                            }
                          ]}
                          placeholder="Password"
                          placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            clearErrorOnChange();
                          }}
                          secureTextEntry
                          autoCorrect={false}
                          spellCheck={false}
                          keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                          returnKeyType="done"
                          editable={!loading}
                          onSubmitEditing={() => {
                            Keyboard.dismiss();
                            handleSubmit();
                          }}
                          onFocus={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Animated.parallel([
                              Animated.spring(passwordInputScaleAnim, {
                                toValue: 1.02,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 0,
                                duration: 150,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: -0.08 * height,
                                duration: 400,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                          onBlur={() => {
                            Animated.parallel([
                              Animated.spring(passwordInputScaleAnim, {
                                toValue: 1,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 1,
                                duration: 200,
                                easing: Easing.in(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: 0,
                                duration: 350,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                        />
                      </Animated.View>
                    </View>

                    {/* Sign In Button with Animation */}
                    <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
                      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                        <Animated.View 
                          style={{ 
                            opacity: buttonGlowAnim,
                            shadowColor: getMinimalGlowColor(),
                            shadowOffset: { width: 2, height: 2 },
                            shadowOpacity: 1,
                            shadowRadius: 6,
                            borderRadius: 12,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          }}
                        />
                        <TouchableOpacity
                          style={[
                            styles.primaryButton,
                            {
                              backgroundColor: theme === 'dark' ? '#0d0d0d' : designTokens.brand.primary,
                              opacity: (loading || isSignInSuccess) ? 0.9 : 1,
                              borderColor: theme === 'dark' ? '#262626' : 'transparent',
                              borderWidth: theme === 'dark' ? 1 : 0,
                              shadowColor: '#ffffff',
                              shadowOffset: { width: 2, height: 2 },
                              shadowOpacity: theme === 'dark' ? 0.15 : 0.1,
                              shadowRadius: 4,
                              elevation: theme === 'dark' ? 3 : 2,
                            }
                          ]}
                          onPress={handleSubmit}
                          disabled={loading || isSignInSuccess}
                          activeOpacity={0.9}
                        >
                          <View style={styles.buttonContent}>
                            <View style={styles.buttonTextContainer}>
                              {loading ? (
                                <Text style={[
                                  styles.primaryButtonText, 
                                  { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }
                                ]}>
                                  Signing In
                                </Text>
                              ) : isSignInSuccess ? (
                                <ShimmerText
                                  customShimmerColor={rainbowPastels[currentColorIndex]}
                                  style={StyleSheet.flatten([styles.primaryButtonText, { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }])}
                                  intensity="vibrant"
                                  duration={800}
                                  waveWidth="wide"
                                >
                                  Success!
                                </ShimmerText>
                              ) : (
                                <Text style={[
                                  styles.primaryButtonText, 
                                  { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }
                                ]}>
                                  Sign In
                                </Text>
                              )}
                            </View>
                            {authStatus !== 'idle' && (
                              <View style={styles.spinnerContainer}>
                                <AnimatedAuthStatus
                                  status={authStatus}
                                  color={theme === 'dark' ? '#ffffff' : '#1a1a1a'}
                                  size={16}
                                  onAnimationComplete={() => {
                                    if (authStatus === 'error') {
                                      setAuthStatus('idle');
                                    }
                                  }}
                                />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    </Animated.View>

                    {/* Create Account Link */}
                    <Animated.View style={{ opacity: linkOpacity }}>
                      <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => {
                          // Light haptic for navigation
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          navigation.navigate('SignUp');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.linkText, 
                          { color: theme === 'dark' ? '#cccccc' : '#b0b0b0' }
                        ]}>
                          Don't have an account? <Text style={[styles.linkTextBold, { color: theme === 'dark' ? '#aaaaaa' : '#888888' }]}>Sign up</Text>
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>

                      {/* Error Message */}
                      {error && (
                        <Animated.View
                          style={[
                            styles.errorContainer,
                            {
                              opacity: fadeAnim,
                              transform: [{ translateY: slideAnim }],
                            },
                          ]}
                        >
                          <Text style={styles.errorText}>{error}</Text>
                        </Animated.View>
                      )}

                      {/* Slow Server Message */}
                      {showSlowServerMessage && !error && (
                        <Animated.View
                          style={[
                            styles.slowServerContainer,
                            {
                              opacity: fadeAnim,
                              transform: [{ translateY: slideAnim }],
                            },
                          ]}
                        >
                          <Text style={[
                            styles.slowServerText,
                            { color: theme === 'dark' ? '#fbbf24' : '#d97706' }
                          ]}>
                            Server may be slow, please wait...
                          </Text>
                        </Animated.View>
                      )}
                    </Animated.View>
                  </View>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </PageBackground>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 100,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  formWrapper: {
    position: 'relative',
    width: '100%',
  },
  formContainer: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  glassmorphic: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.displayMedium,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.bodyMedium,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  subtitleBold: {
    fontWeight: '700',
    fontSize: 22,
  },
  formContent: {
    gap: 24,
  },
  inputGroup: {
    gap: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '400',
    height: 42,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButton: {
    width: '100%',
    height: 37,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  linkTextBold: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
  },
  errorText: {
    ...typography.textStyles.bodyMedium,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  slowServerContainer: {
    marginTop: 16,
  },
  slowServerText: {
    ...typography.textStyles.bodyMedium,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  buttonContainer: {
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SignInScreen;