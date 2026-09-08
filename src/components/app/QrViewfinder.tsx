import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

import { Button, ThemedIcon, ThemedView } from "@/components/ui";
import { qrCodeIcon } from "@/constants";
import type { QrScanStatus } from "@/hooks/auth/useQrScannerMotion";
import { semantic } from "@/tokens";

type CornerPlacement = "tl" | "tr" | "bl" | "br";

function ViewfinderCorner({
  color,
  radius,
  size,
  thickness,
  placement,
}: {
  color: string;
  radius: number;
  size: number;
  thickness: number;
  placement: CornerPlacement;
}) {
  const isTop = placement.startsWith("t");
  const isLeft = placement.endsWith("l");

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: isTop ? 0 : undefined,
        bottom: isTop ? undefined : 0,
        left: isLeft ? 0 : undefined,
        right: isLeft ? undefined : 0,
        width: size,
        height: size,
        borderColor: color,
        borderTopWidth: isTop ? thickness : 0,
        borderBottomWidth: isTop ? 0 : thickness,
        borderLeftWidth: isLeft ? thickness : 0,
        borderRightWidth: isLeft ? 0 : thickness,
        borderTopLeftRadius: placement === "tl" ? radius : 0,
        borderTopRightRadius: placement === "tr" ? radius : 0,
        borderBottomLeftRadius: placement === "bl" ? radius : 0,
        borderBottomRightRadius: placement === "br" ? radius : 0,
      }}
    />
  );
}

type QrViewfinderProps = {
  status: QrScanStatus;
  viewfinderSize: number;
  frameColor: string;
  scanInset: number;
  scanLineStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  cameraPreview?: ReactNode;
  onCancel: () => void;
  onRequestCamera?: () => void;
};

export function QrViewfinder({
  status,
  viewfinderSize,
  frameColor,
  scanInset,
  scanLineStyle,
  cameraPreview,
  onCancel,
  onRequestCamera,
}: QrViewfinderProps) {
  const cornerSize = semantic.size["icon-lg"];
  const cornerRadius = semantic.radius.overlay;
  const cornerThickness = semantic.borderWidth.strong;
  const iconSize = semantic.size["icon-lg"] * 2;

  return (
    <ThemedView align="center" space="comfortable" variant="stack">
      <View
        className="overflow-hidden rounded-overlay bg-brand-subtle"
        style={{
          width: viewfinderSize,
          height: viewfinderSize,
        }}
      >
        {status === "ready" ? (
          <>
            {cameraPreview ?? (
              <Button
                accessibilityLabel="Enable camera"
                className="absolute inset-0 items-center justify-center rounded-none"
                onPress={onRequestCamera}
                ripple={false}
                size="none"
                tone="neutral"
                variant="ghost"
              >
                <ThemedIcon
                  dimension={iconSize}
                  name={qrCodeIcon}
                  tone="brand"
                />
              </Button>
            )}
            <Animated.View
              className="absolute h-0.5 bg-brand-default"
              style={[{ left: scanInset, right: scanInset }, scanLineStyle]}
              pointerEvents="none"
            />
          </>
        ) : null}
        {(["tl", "tr", "bl", "br"] as const).map((placement) => (
          <ViewfinderCorner
            key={placement}
            color={frameColor}
            placement={placement}
            radius={cornerRadius}
            size={cornerSize}
            thickness={cornerThickness}
          />
        ))}
      </View>
      <Button
        className="rounded-card"
        disabled={status !== "ready"}
        label="Cancel"
        onPress={onCancel}
        size="lg"
        style={{
          width: viewfinderSize,
        }}
        tone="alert"
        variant="soft"
      />
    </ThemedView>
  );
}
