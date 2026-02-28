# UI Patterns — Throne App Redesign

## Icon Circles
Used throughout for emoji/icon containers:
```tsx
<View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surfaceElevated,
  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.borderLight }}>
  <Text style={{ fontSize: 22 }}>{emoji}</Text>
</View>
```

## Arrow/Chevron CTA Pattern
Used in list cards for navigation affordance:
```tsx
<View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent + '15',
  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accent + '25' }}>
  <Ionicons name="chevron-forward" size={14} color={COLORS.accent} />
</View>
```

## Gradient Primary Button Pattern
```tsx
<TouchableOpacity style={{ borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.glow }}>
  <LinearGradient colors={GRADIENTS.button} start={{x:0,y:0}} end={{x:1,y:0}} style={{ flexDirection:'row',
    alignItems:'center', justifyContent:'center', gap: SPACING.xs, paddingVertical: SPACING.md }}>
    <Text style={{ color: COLORS.primaryDark, fontSize: 16, fontWeight: '700' }}>Button</Text>
  </LinearGradient>
</TouchableOpacity>
```

## Staggered List Animation
```tsx
<Animated.View entering={FadeInDown.delay(index * 80).springify().damping(18)}>
  {/* list item content */}
</Animated.View>
```

## Section Header Pattern
```tsx
<View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
  <Text style={{ fontSize:13, fontWeight:'700', color: COLORS.textSecondary, letterSpacing:0.5, textTransform:'uppercase' }}>
    Section Title
  </Text>
  <View style={{ backgroundColor: COLORS.accent + '20', paddingHorizontal:8, paddingVertical:2,
    borderRadius: RADIUS.full, borderWidth:1, borderColor: COLORS.accent + '30', marginLeft: SPACING.xs }}>
    <Text style={{ fontSize:11, fontWeight:'800', color: COLORS.accent }}>{count}</Text>
  </View>
</View>
```

## Danger Button Pattern
```tsx
<TouchableOpacity style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap: SPACING.xs,
  paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth:1, borderColor: COLORS.error + '50',
  backgroundColor: COLORS.errorBg }}>
  <Ionicons name="trash-outline" size={16} color={COLORS.error} />
  <Text style={{ color: COLORS.error, fontSize:14, fontWeight:'700' }}>Delete</Text>
</TouchableOpacity>
```

## Bottom Sheet Popup Pattern
```tsx
// Using Animated API (not reanimated) for Modals with non-reanimated context
<Modal transparent animationType="none">
  <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
    <Animated.View style={[{ backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm,
      paddingBottom: SPACING['3xl'], alignItems:'center', borderTopWidth:1, borderTopColor: COLORS.borderLight }]}>
      <View style={{ width:40, height:4, borderRadius:2, backgroundColor: COLORS.border, marginBottom: SPACING.xl }} />
      {/* content */}
    </Animated.View>
  </View>
</Modal>
```

## Card with Separator Footer
```tsx
<View style={{ backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth:1, borderColor: COLORS.border, overflow:'hidden' }}>
  {/* Main content */}
  <View style={{ borderTopWidth:1, borderTopColor: COLORS.borderLight, backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
    {/* Footer content */}
  </View>
</View>
```
