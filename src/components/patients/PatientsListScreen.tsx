import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { PatientCard } from "@/components/patients/PatientCard";
import { PatientsListHeader } from "@/components/patients/PatientsListHeader";
import { PatientsListKpis } from "@/components/patients/PatientsListKpis";
import { Button, ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { chevronUpIcon } from "@/constants";
import type { PatientCardData } from "@/helpers/patientDisplay";
import { useActivePatients } from "@/hooks/useActivePatients";
import { useAddPatientStore, useAuthUser } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

const SCROLL_TO_TOP_THRESHOLD = 120;

function PatientsListEmpty({
  error,
  isLoading,
}: {
  error: Error | null;
  isLoading: boolean;
}) {
  const native = useNativeColors();

  if (isLoading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator color={native.brand.default} />
      </View>
    );
  }

  if (error) {
    return (
      <ThemedText align="center" tone="alert" variant="body">
        Unable to load patients.
      </ThemedText>
    );
  }

  return (
    <ThemedText align="center" tone="muted" variant="body">
      No active patients yet.
    </ThemedText>
  );
}

export function PatientsListScreen() {
  const router = useRouter();
  const native = useNativeColors();
  const flatListRef = useRef<FlatList<PatientCardData>>(null);
  const user = useAuthUser();
  const openAddPatient = useAddPatientStore((state) => state.open);
  const { patients, kpis, isLoading, error } = useActivePatients("", {
    sortBy: "fileDate",
  });

  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const currencySymbol = user?.currencySymbol ?? null;

  const openSearch = useCallback(() => {
    router.push("/patients/search" as Href);
  }, [router]);

  const handleOpenAddPatient = useCallback(() => {
    openAddPatient();
  }, [openAddPatient]);

  const handlePatientPress = useCallback(
    (patient: PatientCardData) => {
      router.push(`/patients/${patient.id}` as Href);
    },
    [router],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setShowScrollToTop(offsetY > SCROLL_TO_TOP_THRESHOLD);
    },
    [],
  );

  const handleScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: PatientCardData }) => (
      <PatientCard onPress={() => handlePatientPress(item)} patient={item} />
    ),
    [handlePatientPress],
  );

  const keyExtractor = useCallback((item: PatientCardData) => item.id, []);

  const listHeaderComponent = useMemo(
    () => (
      <PatientsListKpis currencySymbol={currencySymbol} kpis={kpis} />
    ),
    [currencySymbol, kpis],
  );

  const listEmptyComponent = (
    <PatientsListEmpty error={error} isLoading={isLoading} />
  );

  return (
    <ThemedView className="flex-1" scroll={false} variant="stack">
      <View className="z-10 bg-surface-default">
        <PatientsListHeader
          openAddPatient={handleOpenAddPatient}
          openSearch={openSearch}
        />
      </View>

      <View className="relative flex-1">
        <FlatList
          ref={flatListRef}
          contentContainerStyle={{
            gap: semantic.space.gap.default,
            flexGrow: patients.length === 0 ? 1 : undefined,
            paddingBottom: semantic.space.page,
          }}
          data={patients}
          keyboardShouldPersistTaps="handled"
          keyExtractor={keyExtractor}
          ListEmptyComponent={listEmptyComponent}
          ListHeaderComponent={listHeaderComponent}
          onScroll={handleScroll}
          renderItem={renderItem}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        />

        {showScrollToTop ? (
          <View
            className="absolute inset-x-0 z-10 items-center"
            pointerEvents="box-none"
            style={{ top: semantic.space.stack.compact }}
          >
            <Button
              accessibilityLabel="Scroll to top"
              className="size-control-lg items-center justify-center rounded-pill shadow-sm"
              onPress={handleScrollToTop}
              size="none"
              style={{
                backgroundColor: native.surface.raised,
                borderColor: native.border.subtle,
                borderWidth: semantic.borderWidth.subtle,
              }}
              tone="neutral"
              variant="ghost"
            >
              <ThemedIcon dimension={22} name={chevronUpIcon} tone="brand" />
            </Button>
          </View>
        ) : null}
      </View>
    </ThemedView>
  );
}
