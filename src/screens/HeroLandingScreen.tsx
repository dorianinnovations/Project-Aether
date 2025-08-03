/**
 * Aether - Hero Landing Screen
 * Sophisticated numina-style landing with elegant animations and premium typography
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Header, HeaderMenu } from "../design-system/components/organisms";
import { ShimmerText } from "../design-system/components/atoms";
import { designTokens, getThemeColors } from "../design-system/tokens/colors";
import { useTheme } from "../contexts/ThemeContext";
import { typography } from "../design-system/tokens/typography";
import { spacing } from "../design-system/tokens/spacing";

const { width, height } = Dimensions.get("window");

interface HeroLandingScreenProps {
  navigation: any;
  route: any;
}

const HeroLandingScreen: React.FC<HeroLandingScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme, colors } = useTheme();
  const themeColors = getThemeColors(theme);

  // Staggered load-in animations - start from invisible
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const exploreButtonOpacity = useRef(new Animated.Value(0)).current;
  const signInButtonOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations (kept separate)
  const exploreButtonPressScale = useRef(new Animated.Value(1)).current;
  const demoButtonPressScale = useRef(new Animated.Value(1)).current;
  const signInButtonPressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Use Animated.stagger for better performance
    const staggeredAnimations = Animated.stagger(300, [
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(exploreButtonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(signInButtonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    // Start staggered animations
    staggeredAnimations.start();

    return () => {
      // Cleanup animations on unmount
      staggeredAnimations.stop();
    };
  }, []);

  // Use static glow colors instead of animated ones
  const getStaticGlowColor = () => {
    if (theme === "dark") {
      return "rgba(255, 255, 255, 0.2)";
    } else {
      return "rgba(230, 243, 255, 0.8)";
    }
  };

  const handleSignUpButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Onboarding");
    Animated.sequence([
      Animated.timing(exploreButtonPressScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(exploreButtonPressScale, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCreateAccountButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to sign up screen
    navigation.navigate("SignUp");
    Animated.sequence([
      Animated.timing(demoButtonPressScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(demoButtonPressScale, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSignInButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate immediately, run animation in background
    navigation.navigate("SignIn");
    Animated.sequence([
      Animated.timing(signInButtonPressScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(signInButtonPressScale, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Get gradient colors based on theme
  const getGradientColors = (): readonly [string, string, string, string] => {
    if (theme === "dark") {
      return [
        "#0a0a0a", // Deep black
        "#1a1a2e", // Dark navy
        "#16213e", // Deeper navy
        "#0f0f0f", // Almost black
      ];
    } else {
      return [
        "#f0f6ff", // Light blue-tinted white
        "#dbeafe", // Soft sky blue
        "#bfdbfe", // Medium sky blue
        "#e0f2fe", // Very light cyan-blue
      ];
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      locations={[0, 0.3, 0.7, 1]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />

        {/* Dark mode overlay effect */}
        {theme === "dark" && (
          <View
            style={[styles.darkModeOverlay, { backgroundColor: "#0a0a0a" }]}
          ></View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {/* Enhanced Welcome Text with Professional Animation */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: titleOpacity,
              },
            ]}
          >
            <View
              style={{
                width: "100%",
                alignItems: "center",
                overflow: "visible",
              }}
            >
              <ShimmerText
                style={
                  [
                    styles.welcomeText,
                    {
                      color:
                        theme === "dark"
                          ? "#ffffff"
                          : designTokens.text.secondary,
                      fontFamily: "Nunito-SemiBold",
                    },
                  ] as any
                }
                intensity="vibrant"
                duration={3000}
                delay={1000}
              >
                Decode your adaptive patterns
              </ShimmerText>
            </View>

            {/* Enhanced Brand Text Animation */}
            <Animated.Text
              style={[
                styles.brandText,
                {
                  color: theme === "dark" ? "#C5BDB5" : "#5A5A5A",
                  opacity: brandOpacity,
                },
              ]}
            >
              Numina
            </Animated.Text>
          </Animated.View>

          {/* Action Buttons - Side by side choices */}
          <View style={styles.buttonsContainer}>
            {/* Button Row */}
            <View style={styles.buttonRow}>
              {/* Sign Up Button */}
              <Animated.View
                style={[
                  styles.halfWidth,
                  {
                    opacity: exploreButtonOpacity,
                    transform: [{ scale: exploreButtonPressScale }],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.primaryButtonContainer,
                    {
                      shadowColor: getStaticGlowColor(),
                      shadowOpacity: 0.6,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 8,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={{ width: "100%" }}
                    onPress={handleSignUpButtonPress}
                    activeOpacity={0.9}
                  >
                    <View
                      style={[
                        styles.primaryButton,
                        {
                          backgroundColor:
                            theme === "dark"
                              ? "rgba(15, 15, 15, 0.8)"
                              : designTokens.brand.primary,
                          borderColor:
                            theme === "dark"
                              ? "rgba(38, 38, 38, 0.6)"
                              : "transparent",
                          borderWidth: theme === "dark" ? 1 : 0.5,
                          shadowColor: theme === "dark" ? "#000000" : "#000000",
                          shadowOpacity: theme === "dark" ? 0.2 : 0.1,
                          shadowRadius: 3,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 3,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.primaryButtonText,
                          {
                            color:
                              theme === "dark"
                                ? "#ffffff"
                                : designTokens.text.primary,
                            fontFamily: "Nunito-SemiBold",
                          },
                        ]}
                      >
                        Try First
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              {/* Try Demo Button */}
              <Animated.View
                style={[
                  styles.halfWidth,
                  {
                    opacity: exploreButtonOpacity,
                    transform: [{ scale: demoButtonPressScale }],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.primaryButtonContainer,
                    {
                      shadowColor: getStaticGlowColor(),
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 0 },
                      elevation: 6,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={{ width: "100%" }}
                    onPress={handleCreateAccountButtonPress}
                    activeOpacity={0.9}
                  >
                    <View
                      style={[
                        styles.primaryButton,
                        {
                          backgroundColor:
                            theme === "dark"
                              ? "rgba(26, 26, 26, 0.8)"
                              : "rgba(255, 255, 255, 0.9)",
                          borderColor:
                            theme === "dark"
                              ? "rgba(51, 51, 51, 0.6)"
                              : "rgba(203, 213, 225, 0.5)",
                          borderWidth: theme === "dark" ? 1 : 0.5,
                          shadowColor: theme === "dark" ? "#000000" : "#000000",
                          shadowOpacity: theme === "dark" ? 0.15 : 0.08,
                          shadowRadius: 2,
                          shadowOffset: { width: 0, height: 1 },
                          elevation: 2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.primaryButtonText,
                          {
                            color:
                              theme === "dark"
                                ? "#cccccc"
                                : colors.textSecondary,
                            fontFamily: "Nunito-Medium",
                          },
                        ]}
                      >
                        Create Account
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </View>

            {/* Sign In Link - Underneath */}
            <Animated.View
              style={{
                opacity: signInButtonOpacity,
              }}
            >
              <TouchableOpacity
                style={styles.loginLink}
                onPress={handleSignInButtonPress}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.loginLinkText,
                    {
                      color:
                        theme === "dark" ? colors.textMuted : colors.textMuted,
                      fontFamily: "Nunito-Regular",
                    },
                  ]}
                >
                  Already have an account?{" "}
                  <Text
                    style={[
                      styles.loginLinkBold,
                      {
                        color:
                          theme === "dark"
                            ? colors.textSecondary
                            : colors.textSecondary,
                        fontFamily: "Nunito-SemiBold",
                      },
                    ]}
                  >
                    Sign in
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: Platform.OS === "web" ? 1400 : "100%",
  },
  darkModeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "web" ? 60 : 24,
    paddingVertical: Platform.OS === "web" ? 80 : 40,
  },
  titleContainer: {
    maxWidth: Platform.OS === "web" ? 800 : width * 0.9,
    marginBottom: Platform.OS === "web" ? 60 : 48,
  },
  welcomeText: {
    fontSize:
      Platform.OS === "web" ? 18 : width < 350 ? 10 : width < 400 ? 14 : 16,
    fontWeight: "600",
    textAlign: "center",
    lineHeight:
      Platform.OS === "web" ? 24 : width < 350 ? 14 : width < 400 ? 16 : 17,
    letterSpacing: -1.2,
    opacity: 0.9,
    paddingHorizontal: Platform.OS === "web" ? 40 : 24,
  },
  brandText: {
    fontSize: width < 350 ? 42 : width < 400 ? 48 : 54,
    fontWeight: "700",
    letterSpacing: -4.5,
    textAlign: "center",
    marginTop: 12,
    fontFamily: "CrimsonPro-Bold",
  },

  buttonsContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    justifyContent: "center",
  },
  halfWidth: {
    width: "40%",
  },
  primaryButtonContainer: {
    width: "100%",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButton: {
    width: "100%",
    height: 37,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  loginLink: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.3,
  },
  loginLinkBold: {
    fontWeight: "600",
  },
});

export default HeroLandingScreen;
