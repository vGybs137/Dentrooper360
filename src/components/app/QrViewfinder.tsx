import { SymbolView } from "expo-symbols";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

import { Button, Stack } from "@/components/ui";
import type { QrScanStatus } from "@/hooks/useQrScannerMotion";
import { useThemeTokens } from "@/theme";

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
  pairedMarkStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  onSimulateScan: () => void;
  onCancel: () => void;
};

export function QrViewfinder({
  status,
  viewfinderSize,
  frameColor,
  scanInset,
  scanLineStyle,
  pairedMarkStyle,
  onSimulateScan,
  onCancel,
}: QrViewfinderProps) {
  const theme = useThemeTokens();
  const cornerSize = theme.semantic.size["icon-lg"];
  const cornerRadius = theme.semantic.radius.overlay;
  const cornerThickness = theme.semantic.borderWidth.strong;
  const iconSize = theme.semantic.size["icon-lg"] * 2;

  return (
    <Stack align="center" space="comfortable">
      <Pressable
        accessibilityLabel="Scan clinic QR code"
        accessibilityRole="button"
        disabled={status !== "ready"}
        onPress={onSimulateScan}
      >
        <View
          className="overflow-hidden"
          style={{
            width: viewfinderSize,
            height: viewfinderSize,
            backgroundColor: theme.palette.brand.subtle,
            borderRadius: theme.semantic.radius.overlay,
          }}
        >
          {status === "ready" ? (
            <>
              <View className="absolute inset-0 items-center justify-center">
                <SymbolView
                  name={{
                    ios: "qrcode",
                    android: "qr_code_2",
                    web: "qr_code_2",
                  }}
                  size={iconSize}
                  tintColor={theme.palette.brand.default}
                />
              </View>
              <Animated.View
                className="absolute h-0.5"
                style={[
                  {
                    left: scanInset,
                    right: scanInset,
                    backgroundColor: theme.palette.brand.default,
                  },
                  scanLineStyle,
                ]}
              />
            </>
          ) : (
            <Animated.View
              className="absolute inset-0 items-center justify-center"
              style={pairedMarkStyle}
            >
              <SymbolView
                name={{
                  ios: "checkmark.circle.fill",
                  android: "check_circle",
                  web: "check_circle",
                }}
                size={iconSize}
                tintColor={theme.palette.success.DEFAULT}
              />
            </Animated.View>
          )}
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
      </Pressable>
      <Button
        disabled={status !== "ready"}
        label="Cancel"
        onPress={onCancel}
        size="lg"
        style={{
          width: viewfinderSize,
          borderRadius: theme.semantic.radius.card,
        }}
        tone="alert"
        variant="soft"
      />
    </Stack>
  );
}
