// App-wide constants

export const APP_NAME = 'Throne';

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

// Theme colors — deep navy + electric teal + warm gold
export const COLORS = {
  primary: '#1B4965',        // Deep ocean blue
  primaryDark: '#0B2838',    // Midnight navy
  primaryLight: '#5FA8D3',   // Sky blue
  accent: '#62EAAA',         // Electric mint/teal
  accentLight: '#A8F0D4',    // Soft mint
  accentWarm: '#FFB020',     // Gold for XP/rewards
  background: '#0A0E1A',     // Deep space navy
  backgroundCard: '#111827', // Slightly lighter card bg
  surface: '#1A2237',        // Dark surface with blue tint
  surfaceElevated: '#243049',// Elevated blue-tint
  text: '#F1F5F9',           // Clean white
  textSecondary: '#94A3B8',  // Slate gray
  textLight: '#64748B',      // Muted slate
  success: '#4ADE80',        // Bright green
  warning: '#FBBF24',        // Amber
  error: '#FB7185',          // Soft red-pink
  border: '#1E293B',         // Subtle border
  tabBarActive: '#62EAAA',   // Teal active tab
  tabBarInactive: '#64748B',
  chatBubbleSelf: '#1B4965',
  chatBubbleOther: '#243049',
} as const;

// Gradient presets for LinearGradient
export const GRADIENTS = {
  warm: ['#0A0E1A', '#111827'] as const,
  header: ['#0A0E1A', '#141B2D'] as const,
  gold: ['#FFB020', '#FF8C00'] as const,
  fire: ['#FF6B35', '#FFB020'] as const,
  surface: ['#1A2237', '#111827'] as const,
  accent: ['#62EAAA', '#34D399'] as const,
  banner: ['#0B2838', '#1B4965', '#2D6A8F'] as const,
  navbar: ['#0A0E1A', '#0F1625'] as const,
  button: ['#62EAAA', '#34D399'] as const,
  buttonWarm: ['#FFB020', '#E8940A'] as const,
  buttonDanger: ['#FB7185', '#E5475B'] as const,
  xp: ['#FFB020', '#E8940A'] as const,
} as const;

// Shadow presets
export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  glow: {
    shadowColor: '#62EAAA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glowWarm: {
    shadowColor: '#FFB020',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Credits economy
export const CREDITS = {
  XP_PER_CREDIT: 10,        // 10 XP = 1 credit
  MIN_CONVERT_XP: 100,      // Minimum 100 XP to convert (get 10 credits)
  BUDDY_MATCH_COST: 5,      // 5 credits to find buddy without session
} as const;

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
