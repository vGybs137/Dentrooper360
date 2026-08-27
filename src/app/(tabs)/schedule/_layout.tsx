import { Drawer } from "expo-router/drawer";

import { ScheduleDrawerContent } from "@/components/schedule/ScheduleDrawerContent";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

export default function ScheduleDrawerLayout() {
  const native = useNativeColors();

  return (
    <Drawer
      drawerContent={(props) => <ScheduleDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        sceneStyle: {
          backgroundColor: native.surface.default,
        },
        drawerStyle: {
          width: 280,
          backgroundColor: native.surface.sunken,
        },
        overlayColor: `rgba(0,0,0,${semantic.opacity.scrim})`,
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
