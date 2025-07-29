/**
 * Numina - Social Connections Screen
 * Numina-powered relationship matching and social discovery
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  RefreshControl,
  Alert,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Components
import ConnectionCard from '../../design-system/components/molecules/ConnectionCard';
import CompatibilityScore from '../../design-system/components/molecules/CompatibilityScore';
import { Header, HeaderMenu, SignOutModal } from '../../design-system/components/organisms';

// Design System
import { designTokens, getThemeColors, stateColors } from '../../design-system/tokens/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { createNeumorphicContainer } from '../../design-system/tokens/shadows';
import { useHeaderMenu } from '../../design-system/hooks';

// Services
import { ConnectionsAPI, ApiUtils, AuthAPI } from '../../services/api';

interface Connection {
  id: string;
  name: string;
  avatar?: string;
  connectionType: keyof typeof stateColors.connection;
  compatibilityScore: number;
  sharedInterests: string[];
  distance?: string;
  lastSeen?: string;
  bio?: string;
  breakdown: Array<{
    category: string;
    score: number;
    color: string;
    description?: string;
  }>;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: number;
  category: string;
  matchScore: number;
}

interface ConnectionsScreenProps {
  onThemeToggle?: () => void;
}

const ConnectionsScreen: React.FC<ConnectionsScreenProps> = ({
  onThemeToggle,
}) => {
  const { theme, colors, toggleTheme } = useTheme();
  // State
  const [connections, setConnections] = useState<Connection[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedConnectionType, setSelectedConnectionType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'events'>('connections');
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Navigation
  const navigation = useNavigation();
  
  // Header menu hook
  const { showHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'connections',
    onSignOut: () => setShowSignOutModal(true)
  });

  const themeColors = getThemeColors(theme);

  const connectionTypes = [
    { key: 'all', label: 'All Types', color: designTokens.brand.primary },
    { key: 'soulResonance', label: 'Soul Resonance', color: stateColors.connection.soulResonance },
    { key: 'growthCompanion', label: 'Growth', color: stateColors.connection.growthCompanion },
    { key: 'intellectualPeer', label: 'Intellectual', color: stateColors.connection.intellectualPeer },
    { key: 'emotionalSupport', label: 'Support', color: stateColors.connection.emotionalSupport },
    { key: 'creativeCollaborator', label: 'Creative', color: stateColors.connection.creativeCollaborator },
  ];

  // Load connections data
  const loadConnections = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // Try to make parallel API calls
      let connectionsData, eventsData;
      
      try {
        [connectionsData, eventsData] = await Promise.all([
          ConnectionsAPI.findConnections(selectedConnectionType === 'all' ? undefined : selectedConnectionType),
          ConnectionsAPI.getEvents(),
        ]);
      } catch (apiError) {
        console.log('API endpoints not available, using demo data');
        // Continue with demo data
      }

      // Demo data for MVP demonstration
      const mockConnections: Connection[] = [
        {
          id: '1',
          name: 'Sarah Chen',
          connectionType: 'soulResonance',
          compatibilityScore: 94,
          sharedInterests: ['Mindfulness', 'Philosophy', 'Creative Writing', 'Meditation', 'Psychology'],
          distance: '2.3 km',
          lastSeen: 'Active now',
          bio: 'Exploring consciousness through art and mindfulness. Passionate about deep conversations and authentic connections.',
          breakdown: [
            { category: 'Values Alignment', score: 96, color: stateColors.connection.soulResonance, description: 'Exceptional alignment in core values and life philosophy' },
            { category: 'Communication Style', score: 92, color: designTokens.semantic.success, description: 'Highly compatible communication patterns' },
            { category: 'Interests Overlap', score: 88, color: designTokens.semantic.info, description: 'Strong shared interests in personal growth' },
            { category: 'Lifestyle Match', score: 90, color: designTokens.semantic.wisdom, description: 'Compatible lifestyle preferences and goals' },
          ],
        },
        {
          id: '2',
          name: 'Marcus Rivera',
          connectionType: 'intellectualPeer',
          compatibilityScore: 87,
          sharedInterests: ['Technology', 'AI Ethics', 'Science Fiction', 'Chess'],
          distance: '5.1 km',
          lastSeen: '2 hours ago',
          bio: 'AI researcher fascinated by the intersection of technology and human consciousness.',
          breakdown: [
            { category: 'Intellectual Curiosity', score: 95, color: stateColors.connection.intellectualPeer, description: 'Exceptional intellectual compatibility' },
            { category: 'Discussion Depth', score: 89, color: designTokens.semantic.success, description: 'Great capacity for deep, meaningful discussions' },
            { category: 'Learning Style', score: 82, color: designTokens.semantic.info, description: 'Compatible approaches to learning and growth' },
            { category: 'Problem Solving', score: 86, color: designTokens.semantic.wisdom, description: 'Complementary problem-solving approaches' },
          ],
        },
        {
          id: '3',
          name: 'Luna Rodriguez',
          connectionType: 'creativeCollaborator',
          compatibilityScore: 82,
          sharedInterests: ['Digital Art', 'Music Production', 'Design', 'Innovation'],
          distance: '1.8 km',
          lastSeen: 'Active now',
          bio: 'Digital artist and musician seeking creative collaborators for experimental projects.',
          breakdown: [
            { category: 'Creative Vision', score: 91, color: stateColors.connection.creativeCollaborator, description: 'Strong creative alignment and vision' },
            { category: 'Artistic Style', score: 78, color: designTokens.semantic.warning, description: 'Complementary artistic approaches' },
            { category: 'Collaboration Style', score: 85, color: designTokens.semantic.info, description: 'Compatible working and creative styles' },
            { category: 'Innovation Drive', score: 88, color: designTokens.semantic.success, description: 'Shared passion for innovation and experimentation' },
          ],
        },
      ];

      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Consciousness & AI Discussion Circle',
          description: 'Weekly gathering exploring the intersection of consciousness, technology, and human potential.',
          date: 'Tomorrow, 7:00 PM',
          location: 'Philosophy Café, Downtown',
          attendees: 12,
          category: 'intellectual',
          matchScore: 96,
        },
        {
          id: '2',
          title: 'Creative Collaboration Workshop',
          description: 'Hands-on workshop for artists, musicians, and creators to explore new collaborative techniques.',
          date: 'Friday, 6:30 PM',
          location: 'Innovation Hub',
          attendees: 8,
          category: 'creative',
          matchScore: 89,
        },
        {
          id: '3',
          title: 'Mindful Walking & Meditation',
          description: 'Silent walking meditation in nature followed by group reflection and sharing.',
          date: 'Sunday, 10:00 AM',
          location: 'Riverside Park',
          attendees: 15,
          category: 'mindfulness',
          matchScore: 85,
        },
      ];

      setConnections(mockConnections);
      setEvents(mockEvents);

    } catch (error: any) {
      console.error('Failed to load connections:', error);
      Alert.alert(
        'Error Loading Connections',
        ApiUtils.getErrorMessage(error),
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load data on mount and when connection type changes
  useEffect(() => {
    loadConnections();
  }, [selectedConnectionType]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadConnections(false);
  };

  // Handle connection press
  const handleConnectionPress = (connection: Connection) => {
    Alert.alert(
      connection.name,
      `${connection.bio}\n\nCompatibility: ${connection.compatibilityScore}%\nShared interests: ${connection.sharedInterests.slice(0, 3).join(', ')}`,
      [
        { text: 'View Full Profile', onPress: () => console.log('View profile') },
        { text: 'Start Chat', onPress: () => console.log('Start chat') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Handle connect action
  const handleConnect = async (connection: Connection) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // await ConnectionsAPI.sendConnectionRequest(connection.id);
      Alert.alert(
        'Connection Request Sent!',
        `Your connection request has been sent to ${connection.name}.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      Alert.alert('Error', ApiUtils.getErrorMessage(error));
    }
  };

  // Render connection type filter
  const renderConnectionTypeFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {connectionTypes.map((type) => (
        <TouchableOpacity
          key={type.key}
          style={[
            styles.filterChip,
            selectedConnectionType === type.key && [
              styles.filterChipActive,
              { backgroundColor: type.color + '15', borderColor: type.color }
            ],
            createNeumorphicContainer(theme, 'elevated'),
          ]}
          onPress={() => setSelectedConnectionType(type.key)}
        >
          <Text style={[
            styles.filterText,
            { color: selectedConnectionType === type.key ? type.color : themeColors.textSecondary }
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render event card
  const renderEventCard = (event: Event) => (
    <View key={event.id} style={[styles.eventCard, createNeumorphicContainer(theme, 'elevated')]}>
      <View style={styles.eventHeader}>
        <Text style={[styles.eventTitle, { color: themeColors.text }]}>
          {event.title}
        </Text>
        <View style={[styles.matchBadge, { backgroundColor: designTokens.semantic.success + '15' }]}>
          <Text style={[styles.matchText, { color: designTokens.semantic.success }]}>
            {event.matchScore}% match
          </Text>
        </View>
      </View>
      
      <Text style={[styles.eventDescription, { color: themeColors.textSecondary }]}>
        {event.description}
      </Text>
      
      <View style={styles.eventDetails}>
        <Text style={[styles.eventDate, { color: themeColors.text }]}>
          📅 {event.date}
        </Text>
        <Text style={[styles.eventLocation, { color: themeColors.textMuted }]}>
          📍 {event.location}
        </Text>
        <Text style={[styles.eventAttendees, { color: themeColors.textMuted }]}>
          👥 {event.attendees} attending
        </Text>
      </View>
      
      <TouchableOpacity style={[styles.joinButton, { backgroundColor: designTokens.brand.primary }]}>
        <Text style={styles.joinButtonText}>Join Event</Text>
      </TouchableOpacity>
    </View>
  );

  // Render tab header
  const renderTabHeader = () => (
    <View style={[styles.tabHeader, createNeumorphicContainer(theme, 'elevated')]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'connections' && [styles.tabActive, { backgroundColor: designTokens.brand.primary + '15' }]
        ]}
        onPress={() => setActiveTab('connections')}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'connections' ? designTokens.brand.primary : themeColors.textSecondary }
        ]}>
          Connections ({connections.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'events' && [styles.tabActive, { backgroundColor: designTokens.brand.primary + '15' }]
        ]}
        onPress={() => setActiveTab('events')}
      >
        <Text style={[
          styles.tabText,
          { color: activeTab === 'events' ? designTokens.brand.primary : themeColors.textSecondary }
        ]}>
          Events ({events.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Header menu action handler now provided by useHeaderMenu hook

  // Render header
  const renderHeader = () => (
    <Header
      title="Social Connections"
      subtitle="Numina-powered relationship matching and discovery"
      showMenuButton={true}
      showBackButton={false}
      onMenuPress={toggleHeaderMenu}
      theme={theme}
      isVisible={true}
      isActive={isLoading}
      isMenuOpen={showHeaderMenu}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar 
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Header Menu */}
      <HeaderMenu
        visible={showHeaderMenu}
        onClose={() => {}}
        onAction={handleMenuAction}
        showAuthOptions={false}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={designTokens.brand.primary}
            colors={[designTokens.brand.primary]}
          />
        }
      >
        {renderHeader()}
        {renderTabHeader()}

        {activeTab === 'connections' ? (
          <>
            {renderConnectionTypeFilter()}
            
            <View style={styles.connectionsContainer}>
              {connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  {...connection}
                  
                  onPress={() => handleConnectionPress(connection)}
                  onConnect={() => handleConnect(connection)}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.eventsContainer}>
            {events.map(renderEventCard)}
          </View>
        )}
      </ScrollView>
      
      {/* Sign Out Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={async () => {
          try {
            await AuthAPI.logout();
            // Auth check in App.tsx will handle navigation automatically
          } catch (error) {
            console.error('Sign out error:', error);
          }
        }}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[6],
  },

  // Header
  header: {
    margin: spacing[4],
    padding: spacing[4],
    borderRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.textStyles.headlineMedium,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    ...typography.textStyles.body,
    textAlign: 'center',
  },

  // Tabs
  tabHeader: {
    flexDirection: 'row',
    margin: spacing[4],
    marginTop: 0,
    padding: spacing[1],
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderWidth: 1,
  },
  tabText: {
    ...typography.textStyles.body,
    fontWeight: '500',
  },

  // Filters
  filterContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[3],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterText: {
    ...typography.textStyles.caption,
    fontWeight: '500',
  },

  // Connections
  connectionsContainer: {
    paddingHorizontal: spacing[4],
  },

  // Events
  eventsContainer: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  eventCard: {
    padding: spacing[4],
    borderRadius: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  eventTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing[2],
  },
  matchBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },
  matchText: {
    ...typography.textStyles.caption,
    fontWeight: '600',
  },
  eventDescription: {
    ...typography.textStyles.body,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  eventDetails: {
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  eventDate: {
    ...typography.textStyles.body,
    fontWeight: '500',
  },
  eventLocation: {
    ...typography.textStyles.caption,
  },
  eventAttendees: {
    ...typography.textStyles.caption,
  },
  joinButton: {
    paddingVertical: spacing[3],
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    ...typography.textStyles.body,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default ConnectionsScreen;