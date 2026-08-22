import { Drawer } from "expo-router/drawer";

import { ScheduleDrawerContent } from "@/components/schedule/ScheduleDrawerContent";
import { useThemeTokens } from "@/theme";

export default function ScheduleDrawerLayout() {
  const theme = useThemeTokens();

  return (
    <Drawer
      drawerContent={(props) => <ScheduleDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        sceneStyle: {
          backgroundColor: theme.palette.surface.default,
        },
        drawerStyle: {
          width: 280,
          backgroundColor: theme.palette.surface.sunken,
        },
        overlayColor: `rgba(0,0,0,${theme.semantic.opacity.scrim})`,
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer>
  );
}
