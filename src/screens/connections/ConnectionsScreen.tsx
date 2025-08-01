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

const { width, height } = Dimensions.get('window');

interface Post {
  id: string;
  community: string;
  title: string;
  content?: string;
  author: string;
  authorArchetype?: string;
  time: string;
  engagement: string;
  badge: string;
  image?: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  author: string;
  authorArchetype?: string;
  content: string;
  time: string;
  profilePic?: string;
}

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
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Shimmer animation
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'social',
    onSignOut: () => setShowSignOutModal(true)
  });

  // Loading effect - show skeleton for 2s with shimmer animation
  useEffect(() => {
    // Start shimmer animation with perfect loop after delay
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
            duration: 0, // Instant reset for seamless loop
            useNativeDriver: false,
          }),
        ])
      );
      shimmerLoop.start();
      return shimmerLoop;
    };

    // Delay the start of shimmer animation
    const shimmerDelay = 500; // 500ms delay before starting shimmer
    const shimmerTimeoutId = setTimeout(() => {
      const shimmerLoop = startShimmerAnimation();
      
      // Stop shimmer and hide loading after total time
      const timer = setTimeout(() => {
        shimmerLoop.stop();
        setIsLoading(false);
      }, 2000 - shimmerDelay); // Adjust remaining time

      return () => {
        clearTimeout(timer);
        shimmerLoop.stop();
      };
    }, shimmerDelay);

    return () => {
      clearTimeout(shimmerTimeoutId);
    };
  }, [shimmerAnim]);

  const handleSignOut = async () => {
    try {
      setShowSignOutModal(false);
      await AuthAPI.logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Feed posts
  const feedPosts: Post[] = [
    {
      id: '1',
      community: 'Analytical Minds',
      title: 'React Native performance optimization tips',
      content: 'After months of optimizing our app, here are the top 5 techniques that made the biggest impact on performance...',
      author: 'alex_dev',
      authorArchetype: 'Analytical',
      time: '3h',
      engagement: '47',
      badge: 'Tech Share',
      image: 'https://picsum.photos/400/300?random=2',
      comments: [
        {
          id: '1',
          author: 'jenny_code',
          authorArchetype: 'Curious',
          content: 'This is exactly what I needed! Have you tried using Flipper for debugging?',
          time: '2h',
          profilePic: 'https://i.pravatar.cc/150?img=1'
        },
        {
          id: '2',
          author: 'mike_dev',
          authorArchetype: 'Practical',
          content: 'Great tips! The FlatList optimization saved us 40% render time.',
          time: '1h',
          profilePic: 'https://i.pravatar.cc/150?img=2'
        },
        {
          id: '3',
          author: 'sarah_mobile',
          authorArchetype: 'Analytical',
          content: 'Adding to this - lazy loading components reduced our bundle size by 30%. Game changer!',
          time: '45m',
          profilePic: 'https://i.pravatar.cc/150?img=3'
        },
        {
          id: '4',
          author: 'tom_react',
          authorArchetype: 'Curious',
          content: 'What about memory leaks? I\'ve been struggling with that lately.',
          time: '30m',
          profilePic: 'https://i.pravatar.cc/150?img=4'
        },
        {
          id: '5',
          author: 'lisa_perf',
          authorArchetype: 'Practical',
          content: '@tom_react Try using the React DevTools Profiler. It\'ll show you exactly where the leaks are happening.',
          time: '15m',
          profilePic: 'https://i.pravatar.cc/150?img=5'
        }
      ]
    },
    {
      id: '1a',
      community: 'Curious Thinkers',
      title: 'The philosophy behind modern app design',
      content: 'Been thinking about how our design choices reflect deeper philosophical principles. Is minimalism just aesthetic or something more profound?',
      author: 'philosophy_dev',
      authorArchetype: 'Curious',
      time: '1h',
      engagement: '31',
      badge: 'Discussion',
      comments: [
        {
          id: '6',
          author: 'deep_designer',
          authorArchetype: 'Creative',
          content: 'Minimalism is about reducing cognitive load. It\'s not just pretty - it\'s functional psychology.',
          time: '45m',
          profilePic: 'https://i.pravatar.cc/150?img=6'
        },
        {
          id: '7',
          author: 'ux_thinker',
          authorArchetype: 'Analytical',
          content: 'There\'s actually research showing that cluttered interfaces increase cortisol levels. Clean design = less stress.',
          time: '30m',
          profilePic: 'https://i.pravatar.cc/150?img=7'
        },
        {
          id: '8',
          author: 'retro_lover',
          authorArchetype: 'Creative',
          content: 'But sometimes I miss the personality of older designs... everything looks the same now.',
          time: '20m',
          profilePic: 'https://i.pravatar.cc/150?img=8'
        }
      ]
    },
    {
      id: '2', 
      community: 'Creative Collective',
      title: 'My latest UI design for a mental health app',
      content: 'Spent weeks perfecting this calming interface design. The color psychology here is crucial for user wellbeing.',
      author: 'sarah_ux',
      authorArchetype: 'Creative',
      time: '5h',
      engagement: '52',
      badge: 'Design',
      image: 'https://picsum.photos/400/300?random=1',
      comments: [
        {
          id: '9',
          author: 'david_design',
          authorArchetype: 'Creative',
          content: 'Beautiful work! The gradient choices really set a peaceful mood.',
          time: '4h',
          profilePic: 'https://i.pravatar.cc/150?img=9'
        },
        {
          id: '10',
          author: 'wellness_dev',
          authorArchetype: 'Supportive',
          content: 'This is exactly what the mental health space needs - thoughtful, calming design.',
          time: '3h',
          profilePic: 'https://i.pravatar.cc/150?img=10'
        },
        {
          id: '11',
          author: 'color_theory',
          authorArchetype: 'Analytical',
          content: 'The blue-green palette is scientifically proven to reduce anxiety. Smart choice!',
          time: '2h',
          profilePic: 'https://i.pravatar.cc/150?img=11'
        },
        {
          id: '12',
          author: 'user_advocate',
          authorArchetype: 'Supportive',
          content: 'Have you done user testing? Would love to hear about accessibility considerations.',
          time: '90m',
          profilePic: 'https://i.pravatar.cc/150?img=12'
        },
        {
          id: '13',
          author: 'sarah_ux',
          authorArchetype: 'Creative',
          content: '@user_advocate Yes! Tested with 50+ users including those with visual impairments. High contrast mode included.',
          time: '45m',
          profilePic: 'https://i.pravatar.cc/150?img=13'
        }
      ]
    },
    {
      id: '2a',
      community: 'Practical Minds',
      title: 'My side project just hit 10K users!',
      content: 'Started building this productivity app 6 months ago as a weekend project. Today we crossed 10,000 active users! Here\'s what I learned...',
      author: 'indie_maker',
      authorArchetype: 'Practical',
      time: '2h',
      engagement: '89',
      badge: 'Milestone',
      image: 'https://picsum.photos/400/300?random=3',
      comments: [
        {
          id: '14',
          author: 'startup_fan',
          authorArchetype: 'Curious',
          content: 'Congrats! What was your biggest challenge scaling from 100 to 10K?',
          time: '90m',
          profilePic: 'https://i.pravatar.cc/150?img=14'
        },
        {
          id: '15',
          author: 'growth_hacker',
          authorArchetype: 'Analytical',
          content: 'Amazing! What\'s your tech stack? And how are you handling the server costs?',
          time: '75m',
          profilePic: 'https://i.pravatar.cc/150?img=15'
        },
        {
          id: '16',
          author: 'indie_maker',
          authorArchetype: 'Practical',
          content: '@growth_hacker React Native + Node.js + MongoDB. Server costs about $200/month now, but revenue is covering it!',
          time: '60m',
          profilePic: 'https://i.pravatar.cc/150?img=16'
        },
        {
          id: '17',
          author: 'aspiring_dev',
          authorArchetype: 'Curious',
          content: 'This is so inspiring! Any tips for someone just starting their first side project?',
          time: '30m',
          profilePic: 'https://i.pravatar.cc/150?img=17'
        }
      ]
    },
    {
      id: '3',
      community: 'Supportive Circle',
      title: 'Weekly check-in: How is everyone doing?',
      content: 'Hope everyone is taking care of themselves this week. Remember that small progress is still progress! 💙',
      author: 'mike_wellness',
      authorArchetype: 'Supportive',
      time: '1d',
      engagement: '47',
      badge: 'Community',
      comments: [
        {
          id: '4',
          author: 'anna_positive',
          authorArchetype: 'Supportive',
          content: 'Thank you for always checking in! Had a tough week but feeling better now.',
          time: '20h',
          profilePic: 'https://i.pravatar.cc/150?img=4'
        },
        {
          id: '5',
          author: 'tom_growth',
          authorArchetype: 'Practical',
          content: 'Appreciate these posts. They remind me to pause and reflect.',
          time: '18h',
          profilePic: 'https://i.pravatar.cc/150?img=5'
        }
      ]
    },
    {
      id: '4',
      community: 'Curious Thinkers',
      title: 'Interesting article about AI consciousness',
      content: 'Found this fascinating piece on emergent consciousness in AI systems. What do you all think about the implications?',
      author: 'jenny_research',
      authorArchetype: 'Curious',
      time: '2d',
      engagement: '31',
      badge: 'Discussion',
      comments: [
        {
          id: '6',
          author: 'phil_think',
          authorArchetype: 'Curious',
          content: 'Mind-blowing stuff! The consciousness question keeps me up at night.',
          time: '1d',
          profilePic: 'https://i.pravatar.cc/150?img=6'
        }
      ]
    },
    {
      id: '5',
      community: 'Practical Minds',
      title: 'Daily routine that changed my productivity',
      content: 'After trying dozens of productivity systems, this simple 3-step morning routine has been a game changer for my focus.',
      author: 'david_focus',
      authorArchetype: 'Practical',
      time: '3d',
      engagement: '56',
      badge: 'Life Tips',
      comments: [
        {
          id: '7',
          author: 'lisa_productive',
          authorArchetype: 'Practical',
          content: 'Love this! The key is consistency. Been doing similar for 6 months.',
          time: '2d',
          profilePic: 'https://i.pravatar.cc/150?img=7'
        }
      ]
    },
    {
      id: '6',
      community: 'Analytical Minds',
      title: 'Algorithm breakthrough: O(log n) search in unsorted arrays',
      content: 'After months of research, I think I\'ve found a way to search unsorted arrays in logarithmic time. Still peer-reviewing the math, but early results are promising!',
      author: 'algo_wizard',
      authorArchetype: 'Analytical',
      time: '4h',
      engagement: '156',
      badge: 'Breakthrough',
      comments: [
        {
          id: '30',
          author: 'cs_professor',
          authorArchetype: 'Analytical',
          content: 'This sounds impossible... are you sure about the complexity analysis? What\'s the preprocessing step?',
          time: '3h',
          profilePic: 'https://i.pravatar.cc/150?img=30'
        },
        {
          id: '31',
          author: 'math_lover',
          authorArchetype: 'Curious',
          content: 'Wait, this could revolutionize database indexing if it\'s real. Can you share the paper?',
          time: '2h',
          profilePic: 'https://i.pravatar.cc/150?img=31'
        },
        {
          id: '32',
          author: 'skeptic_dev',
          authorArchetype: 'Analytical',
          content: 'I\'m skeptical but intrigued. The information-theoretic lower bound suggests this shouldn\'t be possible...',
          time: '90m',
          profilePic: 'https://i.pravatar.cc/150?img=32'
        },
        {
          id: '33',
          author: 'algo_wizard',
          authorArchetype: 'Analytical',
          content: '@skeptic_dev You\'re right to be skeptical! The key insight involves probabilistic data structures. Working on formal proof.',
          time: '60m',
          profilePic: 'https://i.pravatar.cc/150?img=33'
        }
      ]
    },
    {
      id: '7',
      community: 'Creative Collective',
      title: 'Free design resources for developers',
      content: 'Curated a list of 50+ free design tools, icon sets, and UI kits that actually don\'t suck. No more Comic Sans in your apps!',
      author: 'design_helper',
      authorArchetype: 'Supportive',
      time: '6h',
      engagement: '234',
      badge: 'Resource',
      image: 'https://picsum.photos/400/300?random=4',
      comments: [
        {
          id: '34',
          author: 'grateful_dev',
          authorArchetype: 'Practical',
          content: 'You\'re a lifesaver! My designer quit last week and I was panicking.',
          time: '5h',
          profilePic: 'https://i.pravatar.cc/150?img=34'
        },
        {
          id: '35',
          author: 'ui_enthusiast',
          authorArchetype: 'Creative',
          content: 'Amazing collection! The Feather icons are my go-to for everything.',
          time: '4h',
          profilePic: 'https://i.pravatar.cc/150?img=35'
        },
        {
          id: '36',
          author: 'startup_founder',
          authorArchetype: 'Practical',
          content: 'This just saved our startup thousands in design costs. Thank you!!',
          time: '3h',
          profilePic: 'https://i.pravatar.cc/150?img=36'
        }
      ]
    },
    {
      id: '8',
      community: 'Curious Thinkers',
      title: 'What if consciousness is just really good compression?',
      content: 'Random shower thought: What if what we call consciousness is just the brain\'s compression algorithm getting so good that it creates the illusion of subjective experience?',
      author: 'shower_philosopher',
      authorArchetype: 'Curious',
      time: '8h',
      engagement: '67',
      badge: 'Question',
      comments: [
        {
          id: '37',
          author: 'neuro_student',
          authorArchetype: 'Analytical',
          content: 'This is actually similar to Integrated Information Theory! Consciousness emerges from information integration.',
          time: '7h',
          profilePic: 'https://i.pravatar.cc/150?img=37'
        },
        {
          id: '38',
          author: 'ai_researcher',
          authorArchetype: 'Curious',
          content: 'Interesting parallel to how LLMs work... are we just biological language models?',
          time: '6h',
          profilePic: 'https://i.pravatar.cc/150?img=38'
        },
        {
          id: '39',
          author: 'philosophy_major',
          authorArchetype: 'Curious',
          content: 'But what about qualia? The redness of red can\'t just be compressed data, right?',
          time: '5h',
          profilePic: 'https://i.pravatar.cc/150?img=39'
        }
      ]
    }
  ];

  // Group posts
  const groupPosts: Post[] = [
    {
      id: 'g1',
      community: 'Study Group - CS401',
      title: 'Looking for 2 more members for advanced algorithms study',
      content: 'We meet every Tuesday and Thursday 6pm at the library. Currently have 4 people, need 2 more committed members.',
      author: 'sarah_cs',
      authorArchetype: 'Analytical',
      time: '2h',
      engagement: '8',
      badge: 'Study Group',
      comments: []
    },
    {
      id: 'g2',
      community: 'Hiking Crew',
      title: 'Weekend hike to Bear Mountain - who\'s in?',
      content: 'Planning a moderate difficulty hike this Saturday. Meeting at 7am, should be back by 4pm. Bring water and snacks!',
      author: 'mike_outdoors',
      authorArchetype: 'Practical',
      time: '4h',
      engagement: '15',
      badge: 'Adventure',
      comments: []
    }
  ];

  // Strategize posts - cognitive planning and problem-solving
  const strategizePosts: Post[] = [
    {
      id: 's1',
      community: 'Cognitive Collective',
      title: 'Breaking down complex problems: Let\'s tackle the climate crisis',
      content: 'Looking for diverse thinkers to deconstruct this massive challenge. No hierarchy - everyone\'s perspective matters equally. What angles should we explore?',
      author: 'alex_systems',
      authorArchetype: 'Analytical',
      time: '1d',
      engagement: '34',
      badge: 'Strategy',
      comments: []
    },
    {
      id: 's2',
      community: 'Mental Frameworks',
      title: 'Building a decision-making framework for career choices',
      content: 'Want to create a systematic approach to major life decisions. Seeking co-thinkers to build this together from scratch.',
      author: 'sara_logic',
      authorArchetype: 'Practical',
      time: '6h',
      engagement: '18',
      badge: 'Framework',
      comments: []
    },
    {
      id: 's3',
      community: 'Thought Experiments',
      title: 'What if we redesigned education from first principles?',
      content: 'Blank slate thinking - no existing assumptions. Equal voices welcome to reimagine how humans could learn and grow.',
      author: 'mike_futures',
      authorArchetype: 'Curious',
      time: '12h',
      engagement: '45',
      badge: 'Experiment',
      comments: []
    }
  ];

  // Collaborate posts - egalitarian group activities 
  const collaboratePosts: Post[] = [
    {
      id: 'c1',
      community: 'Equal Minds',
      title: 'Open art project - everyone contributes equally',
      content: 'Creating a multimedia installation. No single leader - we all shape the vision together. Every idea gets equal weight and consideration.',
      author: 'jenny_collective',
      authorArchetype: 'Creative',
      time: '3h',
      engagement: '22',
      badge: 'Co-Create',
      comments: []
    },
    {
      id: 'c2',
      community: 'Peer Learning',
      title: 'Language exchange circle - teach and learn together',
      content: 'Everyone teaches their native language, everyone learns from others. Rotating leadership, shared knowledge, mutual growth.',
      author: 'david_lingua',
      authorArchetype: 'Supportive',
      time: '8h',
      engagement: '31',
      badge: 'Exchange',
      comments: []
    },
    {
      id: 'c3',
      community: 'Collective Action',
      title: 'Community garden planning - horizontal decision making',
      content: 'Starting a neighborhood garden where every participant has equal say in what we grow, how we organize, and how we share the harvest.',
      author: 'lisa_earth',
      authorArchetype: 'Practical',
      time: '1d',
      engagement: '28',
      badge: 'Community',
      comments: []
    }
  ];

  const getCurrentPosts = () => {
    let posts;
    switch (activeTab) {
      case 'groups': posts = groupPosts; break;
      case 'strategize': posts = strategizePosts; break;
      case 'collaborate': posts = collaboratePosts; break;
      default: posts = feedPosts; break;
    }

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
      case 'Community': return '#10B981';
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
  };

  const closeModal = () => {
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
              onPressIn={() => {
                // Scale down slightly on press
              }}
              onPressOut={() => {
                // Scale back up
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

  // Shimmer component with intensity control
  const ShimmerView = ({ style, children, intensity = 'normal', delay = 0 }: { 
    style: any, 
    children?: React.ReactNode,
    intensity?: 'subtle' | 'normal' | 'strong',
    delay?: number
  }) => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-150, 150], // Wider range for smoother entry/exit
      extrapolate: 'clamp',
    });

    const getShimmerColors = (): [string, string, string] => {
      const intensityMap = {
        subtle: theme === 'dark' 
          ? ['transparent', 'rgba(255,255,255,0.04)', 'transparent'] as [string, string, string]
          : ['transparent', 'rgba(255,255,255,0.3)', 'transparent'] as [string, string, string],
        normal: theme === 'dark'
          ? ['transparent', 'rgba(255,255,255,0.08)', 'transparent'] as [string, string, string]
          : ['transparent', 'rgba(255,255,255,0.5)', 'transparent'] as [string, string, string],
        strong: theme === 'dark'
          ? ['transparent', 'rgba(255,255,255,0.12)', 'transparent'] as [string, string, string]
          : ['transparent', 'rgba(255,255,255,0.7)', 'transparent'] as [string, string, string]
      };
      return intensityMap[intensity];
    };

    return (
      <View style={[style, { overflow: 'hidden' }]}>
        {children}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        >
          <LinearGradient
            colors={getShimmerColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>
    );
  };

  const renderSkeletonTabPills = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {[1, 2, 3, 4].map((item, index) => (
          <ShimmerView
            key={item}
            intensity="subtle"
            delay={index * 100} // Staggered delay: 0ms, 100ms, 200ms, 300ms
            style={[styles.skeletonTabPill, {
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }]}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderSkeletonPost = (index: number) => (
    <View key={`skeleton-${index}`} style={[styles.post, {
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    }]}>
      {/* Skeleton Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.communityInfo}>
          <ShimmerView intensity="subtle" delay={index * 50} style={[styles.skeletonDot, {
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          }]} />
          <ShimmerView intensity="subtle" delay={index * 50 + 100} style={[styles.skeletonText, styles.skeletonCommunity, {
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          }]} />
          <ShimmerView intensity="subtle" delay={index * 50 + 200} style={[styles.skeletonText, styles.skeletonAuthor, {
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          }]} />
          <ShimmerView intensity="subtle" delay={index * 50 + 300} style={[styles.skeletonText, styles.skeletonTime, {
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          }]} />
        </View>
        <ShimmerView intensity="normal" delay={index * 50 + 400} style={[styles.skeletonBadge, {
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        }]} />
      </View>

      {/* Skeleton Title */}
      <View style={styles.skeletonTitleContainer}>
        <ShimmerView delay={index * 50 + 500} style={[styles.skeletonText, styles.skeletonTitleLine1, {
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        }]} />
        <ShimmerView delay={index * 50 + 600} style={[styles.skeletonText, styles.skeletonTitleLine2, {
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        }]} />
      </View>

      {/* Skeleton Image (every 3rd post) */}
      {index % 3 === 1 && (
        <ShimmerView delay={index * 50 + 700} style={[styles.skeletonImage, {
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        }]} />
      )}

      {/* Skeleton Footer */}
      <View style={styles.postFooter}>
        <View style={styles.engagement}>
          <ShimmerView intensity="subtle" delay={index * 50 + 800} style={[styles.skeletonIcon, {
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          }]} />
          <ShimmerView intensity="subtle" delay={index * 50 + 900} style={[styles.skeletonText, styles.skeletonEngagement, {
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          }]} />
        </View>
        <ShimmerView intensity="subtle" delay={index * 50 + 1000} style={[styles.skeletonIcon, {
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        }]} />
      </View>
    </View>
  );

  const renderSkeletonLoader = () => (
    <View style={styles.container}>
      {renderSkeletonTabPills()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {[1, 2, 3, 4, 5].map((index) => renderSkeletonPost(index))}
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

  const handleCreatePost = () => {
    if (!postTitle.trim() || !selectedCommunity) {
      // Simple validation - could be improved
      return;
    }

    // Here you would typically save the post
    console.log('Creating post:', {
      title: postTitle,
      content: postContent, 
      community: selectedCommunity
    });

    // Reset form and close modal
    setPostTitle('');
    setPostContent('');
    setSelectedCommunity('');
    setShowCreatePostModal(false);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
              backgroundColor: postTitle.trim() && selectedCommunity ? '#6AE86F' : themeColors.textMuted,
              opacity: postTitle.trim() && selectedCommunity ? 1 : 0.5
            }]}
            onPress={handleCreatePost}
            disabled={!postTitle.trim() || !selectedCommunity}
          >
            <Text style={[styles.createPostSubmitText, { 
              color: '#FFFFFF'
            }]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.createPostContent}>
          {/* Community Selector */}
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

          {/* Title Input */}
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

          {/* Content Input */}
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

  const renderPostModal = () => {
    if (!selectedPost) return null;

    return (
      <Modal visible={showModal} animationType="slide" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 999, padding: 10 }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              closeModal();
            }}
          >
            <Feather name="x" size={24} color={themeColors.text} />
          </TouchableOpacity>
          
          <ScrollView style={{ flex: 1, padding: 20, paddingTop: 100 }}>
                  {/* Post Header */}
                  <View style={styles.modalPostHeader}>
                    <View style={styles.modalCommunityInfo}>
                      <View style={[
                        styles.communityDot,
                        { backgroundColor: getCommunityColor(selectedPost.community) }
                      ]} />
                      <Text style={[styles.modalCommunity, { color: themeColors.textMuted }]}>
                        {selectedPost.community}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: getBadgeColor(selectedPost.badge) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getBadgeColor(selectedPost.badge) }]}>
                          {selectedPost.badge}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Author Info */}
                  <View style={styles.authorSection}>
                    <Image 
                      source={{ uri: `https://i.pravatar.cc/150?u=${selectedPost.author}` }}
                      style={styles.authorPic}
                    />
                    <View style={styles.authorInfo}>
                      <Text style={[styles.authorName, { color: themeColors.text }]}>
                        {selectedPost.author}
                      </Text>
                      {selectedPost.authorArchetype && (
                        <View style={[styles.archetypeBadge, { backgroundColor: getArchetypeColor(selectedPost.authorArchetype) + '20' }]}>
                          <Text style={[styles.archetypeText, { color: getArchetypeColor(selectedPost.authorArchetype) }]}>
                            {selectedPost.authorArchetype}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.modalTime, { color: themeColors.textMuted }]}>
                        {selectedPost.time} ago
                      </Text>
                    </View>
                  </View>

                  {/* Post Title */}
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                    {selectedPost.title}
                  </Text>

                  {/* Post Content */}
                  {selectedPost.content && (
                    <Text style={[styles.modalText, { color: themeColors.textSecondary }]}>
                      {selectedPost.content}
                    </Text>
                  )}

                  {/* Post Image */}
                  {selectedPost.image && (
                    <Image 
                      source={{ uri: selectedPost.image }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  )}

                  {/* Comments Section */}
                  <View style={styles.commentsSection}>
                    <Text style={[styles.commentsTitle, { color: themeColors.text }]}>
                      Comments ({selectedPost.comments.length})
                    </Text>
                    
                    {selectedPost.comments.map((comment) => (
                      <View key={comment.id} style={styles.comment}>
                        <Image 
                          source={{ uri: comment.profilePic || `https://i.pravatar.cc/150?u=${comment.author}` }}
                          style={styles.commentPic}
                        />
                        <View style={styles.commentContent}>
                          <View style={styles.commentHeader}>
                            <Text style={[styles.commentAuthor, { color: themeColors.text }]}>
                              {comment.author}
                            </Text>
                            {comment.authorArchetype && (
                              <View style={[styles.commentArchetype, { backgroundColor: getArchetypeColor(comment.authorArchetype) + '15' }]}>
                                <Text style={[styles.commentArchetypeText, { color: getArchetypeColor(comment.authorArchetype) }]}>
                                  {comment.authorArchetype}
                                </Text>
                              </View>
                            )}
                            <Text style={[styles.commentTime, { color: themeColors.textMuted }]}>
                              {comment.time}
                            </Text>
                          </View>
                          <Text style={[styles.commentText, { color: themeColors.textSecondary }]}>
                            {comment.content}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <PageBackground theme={theme} variant="social">
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
        
        {isLoading ? (
          renderSkeletonLoader()
        ) : (
          <>
            {renderTabPills()}
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {getCurrentPosts().map((post, index) => (
            <Animated.View
              key={post.id}
              style={{
                opacity: 1,
                transform: [
                  { translateY: 0 },
                  { scale: 1 }
                ]
              }}
            >
              <TouchableOpacity
                style={[styles.post, {
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  openPost(post);
                }}
                activeOpacity={0.8}
                onPressIn={() => {
                  // Slight scale down on press
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

              {/* Post Image Thumbnail */}
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
            </Animated.View>
          ))}
            </ScrollView>
          </>
        )}

        <Animated.View
          style={{
            transform: [{ scale: 1 }]
          }}
        >
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: '#6AE86F' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowCreatePostModal(true);
            }}
            onPressIn={() => {
              // Slight bounce effect
            }}
            activeOpacity={0.8}
          >
            <Feather name="edit-3" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

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

        {renderPostModal()}
        {renderCreatePostModal()}
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  
  // Modal Styles
  modalContent: {
    flex: 1,
    paddingTop: spacing[4],
  },
  modalClose: {
    position: 'absolute',
    top: 60,
    right: spacing[4],
    zIndex: 10,
    padding: spacing[2],
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: 80,
  },
  
  // Modal Post Content
  modalPostHeader: {
    marginBottom: spacing[4],
  },
  modalCommunityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  modalCommunity: {
    fontSize: 14,
    fontWeight: '600',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  authorPic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing[3],
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  archetypeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: spacing[1],
  },
  archetypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalTime: {
    fontSize: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: spacing[3],
    letterSpacing: -0.3,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: spacing[4],
    letterSpacing: -0.1,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: spacing[4],
  },
  postThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: spacing[2],
  },
  
  // Comments
  commentsSection: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing[4],
  },
  comment: {
    flexDirection: 'row',
    marginBottom: spacing[4],
  },
  commentPic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing[3],
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
    gap: spacing[2],
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentArchetype: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: 6,
  },
  commentArchetypeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
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

  // Skeleton Loader Styles
  skeletonTabPill: {
    width: 90,
    height: 32,
    borderRadius: 12,
    marginRight: spacing[2],
  },

  skeletonText: {
    borderRadius: 4,
  },

  skeletonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[1],
  },

  skeletonCommunity: {
    width: 80,
    height: 12,
    marginRight: spacing[1],
  },

  skeletonAuthor: {
    width: 60,
    height: 12,
    marginRight: spacing[1],
  },

  skeletonTime: {
    width: 30,
    height: 12,
  },

  skeletonBadge: {
    width: 50,
    height: 18,
    borderRadius: 12,
  },

  skeletonTitleContainer: {
    marginBottom: spacing[3],
  },

  skeletonTitleLine1: {
    width: '90%',
    height: 16,
    marginBottom: spacing[1],
  },

  skeletonTitleLine2: {
    width: '60%',
    height: 16,
  },

  skeletonImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: spacing[2],
  },

  skeletonIcon: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },

  skeletonEngagement: {
    width: 20,
    height: 12,
    marginLeft: spacing[1],
  },
});

export default SocialScreen;