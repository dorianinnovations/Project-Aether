/**
 * Aether - ConnectionCard Component
 * Beautiful cards for displaying potential connections and relationships
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Design System
import { designTokens, getThemeColors, stateColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { createNeumorphicContainer } from '../../tokens/shadows';

interface ConnectionCardProps {
  id: string;
  name: string;
  avatar?: string;
  connectionType: keyof typeof stateColors.connection;
  compatibilityScore: number;
  sharedInterests: string[];
  distance?: string;
  lastSeen?: string;
  bio?: string;
  theme?: 'light' | 'dark';
  onPress?: () => void;
  onConnect?: () => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  id,
  name,
  avatar,
  connectionType,
  compatibilityScore,
  sharedInterests,
  distance,
  lastSeen,
  bio,
  theme = 'light',
  onPress,
  onConnect,
}) => {
  const themeColors = getThemeColors(theme);
  const connectionColor = stateColors.connection[connectionType];
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleConnectPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConnect?.();
  };

  const getConnectionTypeLabel = () => {
    return connectionType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getCompatibilityColor = () => {
    if (compatibilityScore >= 90) return designTokens.semantic.success;
    if (compatibilityScore >= 75) return designTokens.semantic.warning;
    return designTokens.semantic.info;
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.card, createNeumorphicContainer(theme, 'elevated')]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <View style={[styles.avatarContainer, { backgroundColor: connectionColor + '20' }]}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: connectionColor }]}>
                    <Text style={styles.avatarText}>
                      {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.statusDot, { backgroundColor: designTokens.semantic.success }]} />
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={[styles.name, { color: themeColors.text }]}>
                  {name}
                </Text>
                <View style={[styles.connectionBadge, { backgroundColor: connectionColor + '15' }]}>
                  <Text style={[styles.connectionType, { color: connectionColor }]}>
                    {getConnectionTypeLabel()}
                  </Text>
                </View>
                {distance && (
                  <Text style={[styles.distance, { color: themeColors.textMuted }]}>
                    {distance} • {lastSeen}
                  </Text>
                )}
              </View>
            </View>

            {/* Compatibility Score */}
            <View style={styles.compatibilityContainer}>
              <View style={[
                styles.compatibilityCircle,
                { borderColor: getCompatibilityColor() }
              ]}>
                <Text style={[styles.compatibilityScore, { color: getCompatibilityColor() }]}>
                  {compatibilityScore}%
                </Text>
              </View>
              <Text style={[styles.compatibilityLabel, { color: themeColors.textMuted }]}>
                Match
              </Text>
            </View>
          </View>

          {/* Bio */}
          {bio && (
            <Text style={[styles.bio, { color: themeColors.textSecondary }]}>
              {bio}
            </Text>
          )}

          {/* Shared Interests */}
          <View style={styles.interestsSection}>
            <Text style={[styles.interestsLabel, { color: themeColors.textSecondary }]}>
              Shared Interests
            </Text>
            <View style={styles.interestsTags}>
              {sharedInterests.slice(0, 3).map((interest, index) => (
                <View key={index} style={[styles.interestTag, { backgroundColor: themeColors.surfaces.sunken }]}>
                  <Text style={[styles.interestText, { color: themeColors.text }]}>
                    {interest}
                  </Text>
                </View>
              ))}
              {sharedInterests.length > 3 && (
                <View style={[styles.interestTag, { backgroundColor: connectionColor + '15' }]}>
                  <Text style={[styles.interestText, { color: connectionColor }]}>
                    +{sharedInterests.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: connectionColor }]}
              onPress={handleConnectPress}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.moreButton, { borderColor: themeColors.surfaces.shadow }]}
              onPress={onPress}
            >
              <Text style={[styles.moreButtonText, { color: themeColors.text }]}>
                View Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing[4],
    borderRadius: 20,
    marginVertical: spacing[2],
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },

  profileSection: {
    flexDirection: 'row',
    flex: 1,
  },

  avatarContainer: {
    position: 'relative',
    borderRadius: 25,
    padding: spacing[1],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.textStyles.body,
    color: '#ffffff',
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  profileInfo: {
    marginLeft: spacing[3],
    flex: 1,
  },
  name: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  connectionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    marginBottom: spacing[1],
  },
  connectionType: {
    ...typography.textStyles.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  distance: {
    ...typography.textStyles.caption,
  },

  compatibilityContainer: {
    alignItems: 'center',
  },
  compatibilityCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  compatibilityScore: {
    ...typography.textStyles.body,
    fontWeight: '700',
  },
  compatibilityLabel: {
    ...typography.textStyles.caption,
  },

  bio: {
    ...typography.textStyles.body,
    lineHeight: 18,
    marginBottom: spacing[3],
  },

  interestsSection: {
    marginBottom: spacing[4],
  },
  interestsLabel: {
    ...typography.textStyles.caption,
    fontWeight: '500',
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  interestsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  interestTag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 16,
  },
  interestText: {
    ...typography.textStyles.caption,
    fontWeight: '500',
  },

  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  connectButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    ...typography.textStyles.body,
    color: '#ffffff',
    fontWeight: '600',
  },
  moreButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  moreButtonText: {
    ...typography.textStyles.body,
    fontWeight: '500',
  },
});

export default ConnectionCard;