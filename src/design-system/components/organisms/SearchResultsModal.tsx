/**
 * Search Results Modal - Display web search results in a contextual modal
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { designTokens, getThemeColors, getStandardBorder } from '../../tokens/colors';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { spacing } from '../../tokens/spacing';
import { typography } from '../../tokens/typography';

const { width, height } = Dimensions.get('window');

interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
}

interface SearchResultsModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  results: SearchResult[];
  theme?: 'light' | 'dark';
}

// Helper function to get site-specific icons
const getSiteIcon = (domain: string) => {
  const cleanDomain = domain.toLowerCase().replace('www.', '');
  
  switch (cleanDomain) {
    case 'google.com':
    case 'google':
      return { name: 'google', color: '#4285f4' };
    case 'github.com':
    case 'github':
      return { name: 'github', color: '#333' };
    case 'stackoverflow.com':
    case 'stackoverflow':
      return { name: 'stack-overflow', color: '#f48024' };
    case 'twitter.com':
    case 'x.com':
    case 'twitter':
      return { name: 'twitter', color: '#1da1f2' };
    case 'linkedin.com':
    case 'linkedin':
      return { name: 'linkedin', color: '#0077b5' };
    case 'youtube.com':
    case 'youtube':
      return { name: 'youtube', color: '#ff0000' };
    case 'reddit.com':
    case 'reddit':
      return { name: 'reddit', color: '#ff4500' };
    case 'medium.com':
    case 'medium':
      return { name: 'medium', color: '#00ab6c' };
    case 'dev.to':
    case 'dev':
      return { name: 'dev', color: '#0a0a0a' };
    case 'wikipedia.org':
    case 'wikipedia':
      return { name: 'wikipedia-w', color: '#000' };
    case 'npmjs.com':
    case 'npm':
      return { name: 'npm', color: '#cb3837' };
    case 'codepen.io':
    case 'codepen':
      return { name: 'codepen', color: '#000' };
    case 'dribbble.com':
    case 'dribbble':
      return { name: 'dribbble', color: '#ea4c89' };
    case 'behance.net':
    case 'behance':
      return { name: 'behance', color: '#0057ff' };
    case 'instagram.com':
    case 'instagram':
      return { name: 'instagram', color: '#e4405f' };
    case 'facebook.com':
    case 'facebook':
      return { name: 'facebook', color: '#1877f2' };
    default:
      return { name: 'globe', color: '#6b7280' };
  }
};

// Helper function to extract domain from URL
const extractDomain = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
};

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  visible,
  onClose,
  searchQuery,
  results,
  theme = 'light',
}) => {
  const themeColors = getThemeColors(theme);

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={theme === 'dark' ? 40 : 60}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContainer,
              getGlassmorphicStyle('overlay', theme),
              {
                backgroundColor: theme === 'dark' 
                  ? designTokens.brand.surfaceDark 
                  : designTokens.brand.surface,
                borderColor: themeColors.borders.default,
              }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <FontAwesome5
                  name="search"
                  size={18}
                  color={theme === 'dark' ? designTokens.semanticDark.info : designTokens.semantic.info}
                />
                <Text style={[
                  styles.headerTitle,
                  { color: themeColors.text }
                ]}>
                  Search Results
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <FontAwesome5
                  name="times"
                  size={18}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Search Query */}
            <View style={[
              styles.queryContainer,
              { backgroundColor: themeColors.surface }
            ]}>
              <Text style={[
                styles.queryText,
                { color: themeColors.textSecondary }
              ]}>
                "{searchQuery}"
              </Text>
            </View>

            {/* Results */}
            <ScrollView
              style={styles.resultsContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsContent}
            >
              {results.map((result, index) => {
                const domain = result.domain || extractDomain(result.url);
                const siteIcon = getSiteIcon(domain);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.resultItem,
                      {
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      }
                    ]}
                    onPress={() => handleLinkPress(result.url)}
                    activeOpacity={0.7}
                  >
                    {/* URL breadcrumb - Google style */}
                    <View style={styles.urlBreadcrumb}>
                      <FontAwesome5
                        name={siteIcon.name as any}
                        size={14}
                        color={theme === 'dark' ? siteIcon.color : siteIcon.color}
                        style={styles.siteIcon}
                      />
                      <Text style={[
                        styles.urlText,
                        { color: theme === 'dark' ? '#9ca3af' : '#70757a' }
                      ]}>
                        {domain}
                      </Text>
                      <View style={[
                        styles.urlChevron,
                        { backgroundColor: theme === 'dark' ? '#9ca3af' : '#70757a' }
                      ]} />
                    </View>
                    
                    {/* Title - Google blue link style */}
                    <Text style={[
                      styles.resultTitle,
                      { color: theme === 'dark' ? '#8ab4f8' : '#1a0dab' }
                    ]}>
                      {result.title}
                    </Text>
                    
                    {/* Snippet with proper line height */}
                    {result.snippet && (
                      <Text style={[
                        styles.resultSnippet,
                        { color: theme === 'dark' ? '#bdc1c6' : '#4d5156' }
                      ]}>
                        {result.snippet}
                      </Text>
                    )}
                    
                    {/* Full URL at bottom */}
                    <Text style={[
                      styles.fullUrl,
                      { color: theme === 'dark' ? '#9ca3af' : '#70757a' }
                    ]} numberOfLines={1}>
                      {result.url}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {results.length === 0 && (
                <View style={styles.emptyState}>
                  <FontAwesome5
                    name="search"
                    size={32}
                    color={themeColors.textMuted}
                  />
                  <Text style={[
                    styles.emptyText,
                    { color: themeColors.textMuted }
                  ]}>
                    No search results found
                  </Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  modalContainer: {
    width: Math.min(width - 40, 500),
    maxHeight: height * 0.8,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    marginLeft: spacing[2],
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: spacing[2],
    borderRadius: 8,
  },
  queryContainer: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  queryText: {
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
    minHeight: 200,
  },
  resultsContent: {
    paddingBottom: spacing[4],
  },
  resultItem: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[1],
    borderBottomWidth: 1,
    minHeight: 100,
  },
  urlBreadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  siteIcon: {
    marginRight: spacing[2],
  },
  urlText: {
    fontSize: 14,
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  urlChevron: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: spacing[2],
    opacity: 0.6,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'SF Pro Display',
    lineHeight: 26,
    marginBottom: spacing[1],
    letterSpacing: -0.2,
  },
  resultSnippet: {
    fontSize: 14,
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: spacing[2],
    letterSpacing: 0.1,
  },
  fullUrl: {
    fontSize: 12,
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    letterSpacing: 0.2,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing[2],
  },
});

export default SearchResultsModal;