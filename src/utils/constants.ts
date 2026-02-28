// App-wide constants

export const APP_NAME = 'Royal Throne';

// Session constraints
export const MIN_SESSION_DURATION_SECONDS = 1;
export const MAX_SESSION_DURATION_SECONDS = 3 * 60 * 60; // 3 hours
export const MAX_NOTES_LENGTH = 200;

// "Still pooping?" popup intervals (in seconds)
export const STILL_POOPING_INTERVALS = [
  10 * 60,  // 10 minutes
  20 * 60,  // 20 minutes
  30 * 60,  // 30 minutes
  45 * 60,  // 45 minutes
];

// Prediction
export const HISTOGRAM_BUCKET_SIZE_MINUTES = 15;
export const HISTOGRAM_BUCKETS_PER_DAY = 96; // 24 * 60 / 15
export const DECAY_LAMBDA = 0.95;
export const MIN_SESSIONS_FOR_PREDICTION = 5;
export const PREDICTION_CONFIDENCE_THRESHOLD = 0.5;
export const PREDICTION_NOTIFICATION_LEAD_MINUTES = 10;

// Chat
export const MAX_MESSAGE_LENGTH = 500;
export const MESSAGES_PER_PAGE = 50;
export const MESSAGE_RATE_LIMIT_MS = 1000;

// Health thresholds
export const HEALTHY_DURATION_MAX_SECONDS = 15 * 60; // 15 minutes
export const HEALTHY_DURATION_MIN_SECONDS = 60; // 1 minute
export const HEALTHY_FREQUENCY_MAX_PER_DAY = 4;
export const HEALTHY_FREQUENCY_MIN_PER_DAY = 0.3; // ~once every 3 days

// ─── Design System ────────────────────────────────────────────────────────────

// Premium dark theme: deep midnight + electric emerald + warm amber
export const COLORS = {
  // Core brand
  primary: '#1A3A5C',          // Deep ocean
  primaryDark: '#0D1F35',      // Midnight depth
  primaryLight: '#4A9BC4',     // Sky reflection
  primaryMid: '#1E4976',       // Mid ocean

  // Accent system
  accent: '#00D4A0',           // Electric emerald (slightly shifted from old teal)
  accentLight: '#5EEFC8',      // Light mint
  accentDim: '#00D4A015',      // Very subtle accent bg
  accentWarm: '#F5A623',       // Warm amber for XP/rewards

  // Backgrounds — rich, layered dark
  background: '#080C14',       // Deepest black-blue
  backgroundCard: '#0E1421',   // Card base
  backgroundModal: 'rgba(8,12,20,0.92)', // Modal overlay base

  // Surfaces — multiple elevation levels
  surface: '#111828',          // Base surface
  surfaceRaised: '#172031',    // Slightly raised
  surfaceElevated: '#1E2B40',  // Elevated surface
  surfaceHigh: '#263450',      // High elevation
  surfaceOverlay: 'rgba(255,255,255,0.04)', // Subtle overlay

  // Text hierarchy
  text: '#F0F6FF',             // Primary text — cool white
  textSecondary: '#8EA0B8',    // Secondary — slate blue
  textTertiary: '#4E6380',     // Tertiary — dark slate
  textLight: '#3A4E65',        // Lightest — barely visible
  textInverse: '#080C14',      // Text on light backgrounds

  // Semantic
  success: '#34D399',          // Emerald green
  successBg: '#34D39912',
  warning: '#FBBF24',          // Amber
  warningBg: '#FBBF2412',
  error: '#F87171',            // Soft coral red
  errorBg: '#F8717112',
  info: '#60A5FA',             // Sky blue
  infoBg: '#60A5FA12',

  // Borders
  border: '#192436',           // Subtle dark border
  borderLight: '#1E2E45',      // Slightly lighter
  borderAccent: '#00D4A030',   // Accent-tinted border

  // Chat
  chatBubbleSelf: '#1A3A5C',
  chatBubbleSelfGradient: '#1E4976',
  chatBubbleOther: '#172031',

  // Tab bar
  tabBarActive: '#00D4A0',
  tabBarInactive: '#4E6380',

  // Gradients (used as color arrays)
  // Kept here as single colors for flat usage
  gold: '#F5A623',
} as const;

// Gradient presets for LinearGradient
export const GRADIENTS = {
  // Backgrounds
  background: ['#080C14', '#0E1421'] as const,
  backgroundDeep: ['#060A11', '#0A1020'] as const,

  // Card/surface gradients
  card: ['#111828', '#0E1421'] as const,
  cardElevated: ['#172031', '#111828'] as const,
  surface: ['#1E2B40', '#172031'] as const,

  // Brand gradients
  primary: ['#1A3A5C', '#0D1F35'] as const,
  accent: ['#00D4A0', '#00B589'] as const,
  accentSoft: ['#00D4A020', '#00B58910'] as const,

  // Functional gradients
  button: ['#00D4A0', '#00B589'] as const,
  buttonWarm: ['#F5A623', '#E8940A'] as const,
  buttonDanger: ['#F87171', '#E55858'] as const,
  buttonSecondary: ['#1E2B40', '#172031'] as const,

  // Header/banner
  header: ['#080C14', '#0E1825'] as const,
  banner: ['#0D1F35', '#1A3A5C', '#1E4976'] as const,
  bannerAlt: ['#111828', '#172031', '#1A3A5C'] as const,

  // Special
  xp: ['#F5A623', '#E8940A'] as const,
  fire: ['#FF6B35', '#F5A623'] as const,
  gold: ['#F5A623', '#FFC857'] as const,
  emerald: ['#00D4A0', '#5EEFC8'] as const,

  // Overlay
  fadeBottom: ['transparent', 'rgba(8,12,20,0.9)'] as const,
  fadeTop: ['rgba(8,12,20,0.9)', 'transparent'] as const,

  // Navbar glow
  navbar: ['#080C14', '#0A0F1A'] as const,
} as const;

// Shadow system — platform-aware
export const SHADOWS = {
  none: {},
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHigh: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 14,
  },
  glow: {
    shadowColor: '#00D4A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  glowWarm: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  glowError: {
    shadowColor: '#F87171',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  innerGlow: {
    shadowColor: '#00D4A0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Spacing — 8pt grid
export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// Border radii
export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

// Typography scale
export const TYPOGRAPHY = {
  // Display
  displayLg: { fontSize: 52, fontWeight: '900' as const, letterSpacing: -2 },
  displayMd: { fontSize: 42, fontWeight: '800' as const, letterSpacing: -1.5 },
  displaySm: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },

  // Headings
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  h4: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  h5: { fontSize: 16, fontWeight: '700' as const },

  // Body
  bodyLg: { fontSize: 17, fontWeight: '400' as const, lineHeight: 26 },
  bodyMd: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },

  // Labels
  labelLg: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.1 },
  labelMd: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.2 },
  labelSm: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
  labelXs: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5 },

  // Overline/Caption
  caption: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.3 },
  overline: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;

// Animation presets
export const ANIMATION = {
  spring: { damping: 16, stiffness: 200, mass: 0.8 },
  springBouncy: { damping: 10, stiffness: 180, mass: 0.7 },
  springSnappy: { damping: 20, stiffness: 350, mass: 0.6 },
  springSlow: { damping: 22, stiffness: 120, mass: 1.0 },
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
  },
} as const;

// Credits economy
export const CREDITS = {
  XP_PER_CREDIT: 50,         // 50 XP = 1 credit
  MIN_CONVERT_XP: 250,       // Minimum 250 XP to convert (get 5 credits)
  WEEKLY_CONVERT_CAP: 20,    // Max 20 credits per week from conversion
  BUDDY_MATCH_COST: 5,       // 5 credits to find buddy without session
  CONVERT_PRESETS: [
    { xp: 250, credits: 5 },
    { xp: 500, credits: 10 },
    { xp: 1000, credits: 20 },
  ],
} as const;

// Champion's Wall
export const MAX_CHAMPION_NOTE_LENGTH = 200;

// Leagues
export const MAX_LEAGUE_NAME_LENGTH = 30;
export const MAX_LEAGUE_DESCRIPTION_LENGTH = 200;
export const LEAGUE_JOIN_CODE_LENGTH = 6;
export const LEAGUE_EMOJI_OPTIONS = ['🏆', '💩', '👑', '⚔️', '🔥', '🌟', '🚀', '🎯', '🏰', '⚡', '🦁', '🐉'];

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
} as const;
