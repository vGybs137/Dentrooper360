import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import { StyleSheet, View } from "react-native";

import { Button, ThemedText } from "@/components/ui";
import { APP_TABS } from "@/constants/navigation";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

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
  const native = useNativeColors();
  const tabLabel = typeof children === "string" ? children : undefined;

  return (
    <Button
      {...props}
      accessibilityLabel={props.accessibilityLabel ?? tabLabel}
      size="none"
      style={({ pressed }) => [
        styles.tabButtonPressable,
        pressed ? styles.pressed : null,
      ]}
      tone="neutral"
      variant="ghost"
    >
      <View
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused
              ? native.brand.subtle
              : native.surface.sunken,
            borderRadius: semantic.radius.control,
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
    </Button>
  );
}

function CustomTabList(props: TabListProps) {
  const native = useNativeColors();

  return (
    <View
      {...props}
      style={[
        styles.tabListContainer,
        {
          backgroundColor: native.surface.sunken,
          borderTopColor: native.border.default,
        },
      ]}
    >
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: native.surface.raised,
            borderColor: native.border.default,
            borderRadius: semantic.radius.pill,
            gap: semantic.space.gap.compact,
            paddingHorizontal: semantic.space.inline.default,
            paddingVertical: semantic.space.stack.compact,
            shadowColor: native.foreground.default,
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
