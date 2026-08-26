import { View } from "react-native";

type ColorSwatchProps = {
  color: string;
  size?: number;
};

export function ColorSwatch({ color, size = 10 }: ColorSwatchProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}
