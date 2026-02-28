# UI Redesign Architect Memory — Throne App

## Redesign Status
Complete redesign finished across ALL screens and components.

## Design System (src/utils/constants.ts)
- Background: `#080C14` (deep midnight), Surface: `#111828`, Elevated: `#1E2B40`
- Accent: `#00D4A0` (electric emerald), Warm: `#F5A623` (amber)
- Text primary: `#F0F6FF`, Secondary: `#8EA0B8`, Tertiary: `#4E6380`
- SPACING: xxs=4, xs=8, sm=12, md=16, lg=20, xl=24, 2xl=32, 3xl=40, 4xl=48
- RADIUS: xs=6, sm=10, md=14, lg=18, xl=24, 2xl=32, full=9999
- See: patterns.md for detailed component patterns

## Key Files Changed
- `src/utils/constants.ts` — full design system (COLORS, GRADIENTS, SHADOWS, SPACING, RADIUS, TYPOGRAPHY, ANIMATION)
- `app/(auth)/welcome.tsx` — floating crown logo, feature chips, gradient button
- `app/(tabs)/_layout.tsx` — custom animated tab bar with spring animations
- `app/(tabs)/session.tsx`, `stats.tsx`, `predict.tsx`, `chat.tsx` — all redesigned
- `app/chat/[roomId].tsx`, `app/chat/buddy/[matchId].tsx` — chat screens
- `app/settings.tsx` — full settings redesign
- `app/leagues/*.tsx` — all 4 league screens redesigned
- `src/components/home/*.tsx` — all 7 home cards redesigned
- `src/components/session/*.tsx` — all 5 session components redesigned
- `src/components/chat/*.tsx` — MessageBubble + ChatInput redesigned
- `src/components/ui/*.tsx` — AnimatedButton, AnimatedSplash, XPProgressBar, AnimatedCard, GradientBackground, ConfettiOverlay updated

## Critical Notes
- expo-blur NOT installed — never import BlurView (removed from welcome + tab layout)
- TypeScript clean: 0 errors after removing BlurView imports
- GradientBackground default preset changed from 'warm' (invalid) to 'background'
- ConfettiOverlay colors updated to match palette: emerald, amber, mint, blue
- CREDITS const exported from constants.ts (used by chat.tsx)

## Patterns
See patterns.md for reusable component patterns used throughout the redesign.
