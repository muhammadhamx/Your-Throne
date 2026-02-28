import { Drawer } from 'expo-router/drawer';
import { CustomDrawerContent } from '@/components/navigation/CustomDrawerContent';
import { COLORS } from '@/utils/constants';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 300,
          backgroundColor: COLORS.background,
        },
        overlayColor: 'rgba(0,0,0,0.6)',
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ title: 'Home' }} />
    </Drawer>
  );
}
