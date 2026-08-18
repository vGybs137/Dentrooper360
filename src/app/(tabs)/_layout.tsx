import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
        }}
      />
      <Tabs.Screen
        name="recalls"
        options={{
          title: "Recalls",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
