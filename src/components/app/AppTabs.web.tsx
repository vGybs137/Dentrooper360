import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui";
import { APP_TABS } from "@/constants/navigation";
import { useThemeTokens } from "@/theme";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          {APP_TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useThemeTokens();

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButtonPressable,
        pressed ? styles.pressed : null,
      ]}
    >
      <View
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused
              ? theme.palette.brand.subtle
              : theme.palette.surface.sunken,
            borderRadius: theme.semantic.radius.control,
          },
        ]}
      >
        <ThemedText
          tone={isFocused ? "brand" : "muted"}
          variant="label"
          align="center"
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  const theme = useThemeTokens();

  return (
    <View
      {...props}
      style={[
        styles.tabListContainer,
        {
          backgroundColor: theme.palette.surface.sunken,
          borderTopColor: theme.palette.border.default,
        },
      ]}
    >
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: theme.palette.surface.raised,
            borderColor: theme.palette.border.default,
            borderRadius: theme.semantic.radius.pill,
            gap: theme.semantic.space.gap.compact,
            paddingHorizontal: theme.semantic.space.inline.default,
            paddingVertical: theme.semantic.space.stack.compact,
            shadowColor: theme.palette.foreground.default,
          },
        ]}
      >
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: "100%",
  },
  tabListContainer: {
    position: "absolute",
    width: "100%",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    borderTopWidth: 1,
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    flexGrow: 1,
    maxWidth: 960,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  tabButtonPressable: {
    flexGrow: 1,
    flexBasis: "18%",
    minWidth: 88,
  },
  tabButtonView: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.82,
  },
});
