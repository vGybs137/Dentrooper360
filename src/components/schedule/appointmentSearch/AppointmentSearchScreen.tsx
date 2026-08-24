import { useRouter, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppointmentSearchResultItem } from "@/components/schedule/appointmentSearch/AppointmentSearchResultItem";
import { TextField, ThemedText } from "@/components/ui";
import { searchIcon } from "@/constants";
import { useAppointmentSearch } from "@/hooks/useAppointmentSearch";
import { useThemeTokens } from "@/theme";
import type { MonthDayEventPreview } from "@/types/schedule";

const CHEVRON_LEFT_ICON = {
  ios: "chevron.left",
  android: "chevron_left",
  web: "chevron_left",
} as const;

function SearchDivider() {
  return <View className="h-px w-full bg-border-subtle" />;
}

export function AppointmentSearchScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { results, isLoading, error } = useAppointmentSearch(query);
  const hasQuery = query.trim().length > 0;

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/schedule" as Href);
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: MonthDayEventPreview }) => (
      <AppointmentSearchResultItem event={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: MonthDayEventPreview) => item.id, []);

  return (
    <SafeAreaView
      className="flex-1 bg-surface-default"
      edges={["top", "left", "right"]}
    >
      <View
        className="flex-row items-center px-page pb-stack-compact"
        style={{ minHeight: theme.semantic.size.touch }}
      >
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={goBack}
          style={{
            alignItems: "flex-start",
            justifyContent: "center",
            width: theme.semantic.size.touch,
            minHeight: theme.semantic.size.touch,
          }}
        >
          <SymbolView
            name={CHEVRON_LEFT_ICON}
            size={theme.semantic.size.icon}
            tintColor={theme.palette.foreground.default}
          />
        </Pressable>

        <View className="min-w-0 flex-1 items-center justify-center">
          <ThemedText numberOfLines={1} variant="title">
            Search
          </ThemedText>
        </View>

        <View style={{ width: theme.semantic.size.touch }} />
      </View>

      <View className="px-page pb-stack-default">
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          containerClassName="w-full"
          leading={
            <SymbolView
              name={searchIcon}
              size={theme.semantic.size.icon}
              tintColor={theme.palette.foreground.muted}
            />
          }
          onChangeText={setQuery}
          placeholder="Search by subject..."
          returnKeyType="search"
          value={query}
          variant="soft"
        />
        <SearchDivider />
      </View>

      {!hasQuery ? (
        <View className="flex-1 items-center px-page pt-stack-default">
          <ThemedText align="center" tone="muted" variant="body">
            Enter a subject to find appointments.
          </ThemedText>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={theme.palette.brand.default} />
        </View>
      ) : error ? (
        <View className="flex-1 px-page pt-stack-default">
          <ThemedText tone="alert" variant="body">
            Unable to search appointments.
          </ThemedText>
        </View>
      ) : results.length === 0 ? (
        <View className="flex-1 px-page pt-stack-default">
          <ThemedText align="center" tone="muted" variant="body">
            No appointments match &quot;{query.trim()}&quot;.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={results}
          keyboardShouldPersistTaps="handled"
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: theme.semantic.space.page,
          }}
        />
      )}
    </SafeAreaView>
  );
}
