import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Image,
  Dimensions,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { Header, HeaderMenu, SignOutModal } from '../../design-system/components/organisms';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { getThemeColors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { useHeaderMenu } from '../../design-system/hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthAPI } from '../../services/api';
import { PostsAPI, Post, Comment } from '../../services/postsApi';
import { websocketClient } from '../../services/websocketClient';

const { width, height } = Dimensions.get('window');

interface SocialScreenProps {}

const SocialScreen: React.FC<SocialScreenProps> = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  
  // Create post form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Loading and data state
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Shimmer animation
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'social',
    onSignOut: () => setShowSignOutModal(true)
  });

  // Initialize WebSocket and load posts
  useEffect(() => {
    initializeScreen();
    return () => {
      // Cleanup WebSocket listeners
      websocketClient.off('post:created', handlePostCreated);
      websocketClient.off('post:updated', handlePostUpdated);
      websocketClient.off('post:deleted', handlePostDeleted);
      websocketClient.off('comment:created', handleCommentCreated);
    };
  }, []);

  // WebSocket and posts initialization
  const initializeScreen = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Start shimmer animation
      startShimmerAnimation();

      // Connect to WebSocket if not already connected
      if (!websocketClient.connected) {
        await websocketClient.connect();
      }

      // Setup WebSocket event listeners
      setupWebSocketListeners();

      // Load initial posts
      await loadPosts();

      // Stop shimmer and show content after delay
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to initialize screen:', error);
      setError('Failed to load posts. Please try again.');
      setIsLoading(false);
    }
  };

  // Start shimmer animation
  const startShimmerAnimation = () => {
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    shimmerLoop.start();
    return shimmerLoop;
  };

  // Load posts from API
  const loadPosts = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      
      const response = await PostsAPI.getPosts({
        tab: activeTab as 'feed' | 'groups' | 'strategize' | 'collaborate',
        search: searchQuery || undefined,
        limit: 20
      });
      
      setPosts(response.posts);
      setError(null);
    } catch (error) {
      console.error('Failed to load posts:', error);
      setError('Failed to load posts');
    } finally {
      if (refresh) setRefreshing(false);
    }
  };

  // Setup WebSocket event listeners
  const setupWebSocketListeners = () => {
    websocketClient.on('post:created', handlePostCreated);
    websocketClient.on('post:updated', handlePostUpdated);
    websocketClient.on('post:deleted', handlePostDeleted);
    websocketClient.on('comment:created', handleCommentCreated);
  };

  // WebSocket event handlers
  const handlePostCreated = (data: { post: Post; userId: string }) => {
    setPosts(prevPosts => [data.post, ...prevPosts]);
  };

  const handlePostUpdated = (data: { post: Post; userId: string }) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === data.post.id ? data.post : post
      )
    );
  };

  const handlePostDeleted = (data: { postId: string; userId: string }) => {
    setPosts(prevPosts => 
      prevPosts.filter(post => post.id !== data.postId)
    );
  };

  const handleCommentCreated = (data: { postId: string; comment: Comment; userId: string }) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === data.postId 
          ? { ...post, comments: [...post.comments, data.comment], engagement: (parseInt(post.engagement) + 1).toString() }
          : post
      )
    );
  };

  // Reload posts when activeTab or searchQuery changes
  useEffect(() => {
    if (!isLoading) {
      loadPosts();
    }
  }, [activeTab, searchQuery]);

  const handleSignOut = async () => {
    try {
      setShowSignOutModal(false);
      await AuthAPI.logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const getCurrentPosts = () => {
    // Filter posts based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return posts.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.content?.toLowerCase().includes(query) ||
        post.community.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        post.badge.toLowerCase().includes(query)
      );
    }

    return posts;
  };

  const getCommunityColor = (community: string) => {
    switch (community) {
      case 'Analytical Minds': return '#5CC7E8';
      case 'Creative Collective': return '#C95FD6';
      case 'Supportive Circle': return '#6AE86F';
      case 'Curious Thinkers': return '#FFE066';
      case 'Practical Minds': return '#FF6B6B';
      case 'Study Group - CS401': return '#5CC7E8';
      case 'Hiking Crew': return '#6AE86F';
      case 'Cognitive Collective': return '#A78BFA';
      case 'Mental Frameworks': return '#34D399';
      case 'Thought Experiments': return '#F59E0B';
      case 'Equal Minds': return '#EC4899';
      case 'Peer Learning': return '#06B6D4';
      case 'Collective Action': return '#10B981';
      default: return '#9CA3AF';
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Tech Share': return '#4FB3D9';
      case 'Design': return '#FF8FA3';
      case 'Community': return '#7FDBCA';
      case 'Discussion': return '#FFD54F';
      case 'Life Tips': return '#FFA726';
      case 'Study Group': return '#5CC7E8';
      case 'Adventure': return '#6AE86F';
      case 'Strategy': return '#A78BFA';
      case 'Framework': return '#34D399';
      case 'Experiment': return '#F59E0B';
      case 'Co-Create': return '#EC4899';
      case 'Exchange': return '#06B6D4';
      case 'Milestone': return '#F59E0B';
      case 'Question': return '#8B5CF6';
      case 'Resource': return '#10B981';
      case 'Breakthrough': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const getArchetypeColor = (archetype?: string) => {
    switch (archetype) {
      case 'Analytical': return '#5CC7E8';
      case 'Creative': return '#C95FD6';
      case 'Supportive': return '#6AE86F';
      case 'Curious': return '#FFE066';
      case 'Practical': return '#FF6B6B';
      default: return '#9CA3AF';
    }
  };

  const openPost = (post: Post) => {
    setSelectedPost(post);
    setShowModal(true);
    
    // Join the post room for live updates
    websocketClient.joinPost(post.id);
    websocketClient.viewPost(post.id);
  };

  const closeModal = () => {
    if (selectedPost) {
      websocketClient.leavePost(selectedPost.id);
    }
    setShowModal(false);
    setSelectedPost(null);
  };

  const tabs = [
    { id: 'feed', label: 'Feed', icon: 'message-circle', color: '#3B82F6' },
    { id: 'groups', label: 'Groups', icon: 'users', color: '#10B981' },
    { id: 'strategize', label: 'Strategize', icon: 'target', color: '#8B5CF6' },
    { id: 'collaborate', label: 'Collaborate', icon: 'layers', color: '#EC4899' },
  ];

  const renderTabPills = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {tabs.map((tab) => (
          <Animated.View key={tab.id}>
            <TouchableOpacity
              style={[
                styles.tabPill,
                {
                  backgroundColor: activeTab === tab.id 
                    ? tab.color 
                    : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  borderColor: activeTab === tab.id 
                    ? tab.color 
                    : tab.color + '30',
                  transform: activeTab === tab.id ? [{ scale: 1.02 }] : [{ scale: 1 }]
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
            >
              <Feather 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.id ? '#fff' : tab.color} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.id ? '#fff' : tab.color }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );

  // Available communities for the dropdown
  const communities = [
    'Analytical Minds',
    'Creative Collective', 
    'Supportive Circle',
    'Curious Thinkers',
    'Practical Minds',
    'Study Group - CS401',
    'Hiking Crew',
    'Cognitive Collective',
    'Mental Frameworks',
    'Thought Experiments',
    'Equal Minds',
    'Peer Learning',
    'Collective Action'
  ];

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !selectedCommunity) {
      Alert.alert('Error', 'Please provide a title and select a community');
      return;
    }

    try {
      setIsCreatingPost(true);

      const postData = {
        title: postTitle.trim(),
        content: postContent.trim() || undefined,
        community: selectedCommunity,
        badge: 'Discussion' // Default badge
      };

      await PostsAPI.createPost(postData);

      // Reset form and close modal
      setPostTitle('');
      setPostContent('');
      setSelectedCommunity('');
      setShowCreatePostModal(false);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Refresh posts to show the new post
      await loadPosts(true);
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const renderCreatePostModal = () => (
    <Modal 
      visible={showCreatePostModal} 
      animationType="slide" 
      onRequestClose={() => setShowCreatePostModal(false)}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff' 
      }}>
        {/* Header */}
        <View style={styles.createPostHeader}>
          <TouchableOpacity 
            style={styles.createPostClose}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreatePostModal(false);
            }}
          >
            <Feather name="x" size={24} color={themeColors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.createPostTitle, { color: themeColors.text }]}>
            Create Post
          </Text>
          
          <TouchableOpacity 
            style={[styles.createPostSubmit, { 
              backgroundColor: postTitle.trim() && selectedCommunity && !isCreatingPost ? '#6AE86F' : themeColors.textMuted,
              opacity: postTitle.trim() && selectedCommunity && !isCreatingPost ? 1 : 0.5
            }]}
            onPress={handleCreatePost}
            disabled={!postTitle.trim() || !selectedCommunity || isCreatingPost}
          >
            <Text style={[styles.createPostSubmitText, { 
              color: '#FFFFFF'
            }]}>
              {isCreatingPost ? 'Creating...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.createPostContent}>
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>
              Community
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.communityScroll}
            >
              {communities.map((community) => (
                <TouchableOpacity
                  key={community}
                  style={[
                    styles.communityChip,
                    {
                      backgroundColor: selectedCommunity === community 
                        ? getCommunityColor(community) 
                        : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      borderColor: selectedCommunity === community 
                        ? getCommunityColor(community) 
                        : getCommunityColor(community) + '30',
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCommunity(community);
                  }}
                >
                  <View style={[
                    styles.communityDot,
                    { backgroundColor: getCommunityColor(community) }
                  ]} />
                  <Text style={[
                    styles.communityChipText,
                    { color: selectedCommunity === community ? '#fff' : getCommunityColor(community) }
                  ]}>
                    {community}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>
              Title
            </Text>
            <TextInput
              style={[styles.titleInput, { 
                color: themeColors.text,
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              }]}
              value={postTitle}
              onChangeText={setPostTitle}
              placeholder="What's on your mind?"
              placeholderTextColor={themeColors.textMuted}
              multiline={true}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: themeColors.text }]}>
              Content (Optional)
            </Text>
            <TextInput
              style={[styles.contentInput, { 
                color: themeColors.text,
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              }]}
              value={postContent}
              onChangeText={setPostContent}
              placeholder="Share more details, ask questions, or start a discussion..."
              placeholderTextColor={themeColors.textMuted}
              multiline={true}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <PageBackground theme={theme} variant="social">
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: themeColors.text }]}>
              Loading posts...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: themeColors.text }]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => loadPosts(true)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderTabPills()}
        
            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => loadPosts(true)} />
              }
            >
              {getCurrentPosts().map((post, index) => (
                <TouchableOpacity
                  key={post.id}
                  style={[styles.post, {
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    openPost(post);
                  }}
                >
                  <View style={styles.postHeader}>
                    <View style={styles.communityInfo}>
                      <View style={[
                        styles.communityDot,
                        { backgroundColor: getCommunityColor(post.community) }
                      ]} />
                      <Text style={[styles.community, { color: themeColors.textMuted }]}>
                        {post.community}
                      </Text>
                      <Text style={[styles.author, { color: themeColors.textMuted }]}>
                        • {post.author}
                      </Text>
                      <Text style={[styles.time, { color: themeColors.textMuted }]}>
                        • {post.time}
                      </Text>
                    </View>
                    
                    <View style={[styles.badge, { backgroundColor: getBadgeColor(post.badge) + '20' }]}>
                      <Text style={[styles.badgeText, { color: getBadgeColor(post.badge) }]}>
                        {post.badge}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.title, { color: themeColors.text }]}>
                    {post.title}
                  </Text>

                  {post.image && (
                    <Image 
                      source={{ uri: post.image }}
                      style={styles.postThumbnail}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.postFooter}>
                    <View style={styles.engagement}>
                      <Feather name="message-circle" size={14} color={themeColors.textMuted} />
                      <Text style={[styles.engagementText, { color: themeColors.textMuted }]}>
                        {post.engagement}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Feather name="share" size={14} color={themeColors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#6AE86F' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowCreatePostModal(true);
          }}
        >
          <Feather name="edit-3" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <Header
          title="Social"
          showMenuButton={true}
          showSearchButton={true}
          onMenuPress={toggleHeaderMenu}
          onSearchPress={() => setShowSearch(!showSearch)}
          theme={theme}
          isVisible={true}
          isMenuOpen={showHeaderMenu}
          showSearch={showSearch}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search posts..."
        />

        <HeaderMenu
          visible={showHeaderMenu}
          onClose={() => setShowHeaderMenu(false)}
          onAction={handleMenuAction}
          showAuthOptions={true}
        />

        <SignOutModal
          visible={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleSignOut}
          theme={theme}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmText="Sign Out"
          cancelText="Cancel"
          variant="danger"
        />

        {renderCreatePostModal()}
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retryButton: {
    backgroundColor: '#6AE86F',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Tab Pills
  tabContainer: {
    paddingTop: 80,
    paddingBottom: spacing[5],
    paddingLeft: spacing[4],
    paddingRight: spacing[2],
  },
  tabScroll: {
    flexGrow: 0,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: spacing[2],
    gap: 6,
    borderWidth: 1,
    minWidth: 90,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: spacing[4],
  },
  post: {
    padding: spacing[4],
    marginBottom: spacing[3],
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  communityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[1],
  },
  community: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: spacing[1],
  },
  author: {
    fontSize: 12,
    marginRight: spacing[1],
  },
  time: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: spacing[3],
    letterSpacing: -0.2,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  engagement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  engagementText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    padding: spacing[1],
  },
  fab: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  postThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: spacing[2],
  },
  
  // Create Post Modal Styles
  createPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  createPostClose: {
    padding: spacing[2],
  },
  createPostTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  createPostSubmit: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
  },
  createPostSubmitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createPostContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  formSection: {
    marginBottom: spacing[5],
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  communityScroll: {
    flexGrow: 0,
  },
  communityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 20,
    marginRight: spacing[2],
    borderWidth: 1,
    gap: spacing[1],
  },
  communityChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing[3],
    fontSize: 16,
    minHeight: 80,
    maxHeight: 120,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing[3],
    fontSize: 14,
    minHeight: 120,
    maxHeight: 200,
  },
});

export default SocialScreen;