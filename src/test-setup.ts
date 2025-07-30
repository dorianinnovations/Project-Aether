// Test setup for React Native Jest tests

// Mock react-native modules - use more generic approach
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Mock Expo modules
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: ({ children }: { children?: React.ReactNode }) => children || null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => children || null,
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: React.ReactNode }) => children || null,
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn(() => Promise.resolve('')),
  hasStringAsync: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({ type: 'cancel' })),
  DocumentPickerOptions: {},
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
    Warning: 'warning',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
    replace: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ children }: { children: React.ReactNode }) => children,
  }),
}));

// Mock Lottie
jest.mock('lottie-react-native', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) =>
      React.createElement('View', { ...props, ref, testID: 'lottie-animation' })
    ),
  };
});

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: (component: any) => component,
    Directions: {},
  };
});

// Mock Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('@expo/vector-icons', () => ({
  Feather: 'Icon',
  MaterialIcons: 'Icon',
  Ionicons: 'Icon',
  FontAwesome: 'Icon',
}));

// Mock theme and settings contexts
jest.mock('./contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    colors: {
      background: '#ffffff',
      text: '#000000',
      primary: '#007AFF',
      borders: {
        default: '#e1e4e8',
        subtle: '#f1f3f4',
      },
      textMuted: '#6c757d',
      textSecondary: '#8e8e93',
      surface: '#f8f9fa',
      surfaces: {
        sunken: '#e9ecef',
        elevated: '#ffffff',
        card: '#ffffff',
      },
      error: '#ff4757',
    },
    toggleTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('./contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      notifications: true,
      darkMode: false,
    },
    updateSetting: jest.fn(),
  }),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock API services
jest.mock('./services/api', () => ({
  TokenManager: {
    getToken: jest.fn(() => Promise.resolve('mock-token')),
    setToken: jest.fn(() => Promise.resolve()),
    removeToken: jest.fn(() => Promise.resolve()),
    getUserData: jest.fn(() => Promise.resolve({ id: '1', email: 'test@test.com' })),
    setUserData: jest.fn(() => Promise.resolve()),
  },
  AuthAPI: {
    login: jest.fn(() => Promise.resolve({ status: 'success', token: 'mock-token', data: { user: { id: '1', email: 'test@test.com' } } })),
    signup: jest.fn(() => Promise.resolve({ status: 'success', token: 'mock-token', data: { user: { id: '1', email: 'test@test.com' } } })),
    logout: jest.fn(() => Promise.resolve()),
  },
  UserAPI: {
    getProfile: jest.fn(() => Promise.resolve({ status: 'success', data: { user: { id: '1', email: 'test@test.com', name: 'Test User' } } })),
    updateProfile: jest.fn(() => Promise.resolve({ status: 'success' })),
    uploadProfilePicture: jest.fn(() => Promise.resolve({ status: 'success', data: { profilePicture: 'mock-url' } })),
    deleteProfilePicture: jest.fn(() => Promise.resolve({ status: 'success' })),
  },
  AnalyticsAPI: {
    getPersonalInsights: jest.fn(() => Promise.resolve({ status: 'success', data: [] })),
    getEmotionalAnalytics: jest.fn(() => Promise.resolve({ status: 'success', data: [] })),
    getUBPMContext: jest.fn(() => Promise.resolve({ success: true, data: {} })),
    getCollectiveSnapshot: jest.fn(() => Promise.resolve({ success: true, snapshot: {} })),
    getUserBehaviorProfile: jest.fn(() => Promise.resolve({ status: 'success', data: {} })),
    getCollectiveEmotions: jest.fn(() => Promise.resolve({ status: 'success', data: [] })),
  },
  ConnectionsAPI: {
    findConnections: jest.fn(() => Promise.resolve({ status: 'success', data: [] })),
    analyzeCompatibility: jest.fn(() => Promise.resolve({ status: 'success', data: {} })),
    getConnections: jest.fn(() => Promise.resolve({ status: 'success', data: [] })),
  },
  ChatAPI: {
    sendMessage: jest.fn(() => Promise.resolve({ content: 'Mock response' })),
    sendAdaptiveMessage: jest.fn(() => Promise.resolve({ content: 'Mock response' })),
  }
}));

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers for animations
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(async () => {
  // Clear all pending timers and intervals
  jest.runOnlyPendingTimers();
  jest.clearAllTimers();
  jest.useRealTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  jest.resetAllMocks();
  
  // Wait for any pending promises to resolve
  await new Promise(resolve => setImmediate(resolve));
});

// Add global teardown for test suites
afterAll(async () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Clear any remaining timers
  jest.clearAllTimers();
  
  // Wait for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});