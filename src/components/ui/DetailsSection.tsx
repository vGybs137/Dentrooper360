import { View } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { cn } from "@/helpers/ui/cn";
import { useNativeColors } from "@/theme";

export type DetailsField = {
  label: string;
  value: string;
  empty?: boolean;
};

export type DetailsNote = {
  label?: string;
  value: string;
  empty?: boolean;
};

type DetailsSectionProps = {
  title: string;
  fields: readonly DetailsField[];
  note?: DetailsNote | null;
  className?: string;
};

function DashedDivider() {
  const native = useNativeColors();

  return (
    <View className="h-px w-full overflow-hidden">
      <View
        style={{
          borderStyle: "dashed",
          borderWidth: 1,
          borderColor: native.border.subtle,
          margin: -1,
        }}
      />
    </View>
  );
}

function DetailsRow({ label, value, empty }: DetailsField) {
  return (
    <View className="w-full flex-row items-center justify-between gap-inline py-stack">
      <ThemedText className="shrink-0" tone="muted" variant="body">
        {label}
      </ThemedText>
      <ThemedText
        align="right"
        className={cn("min-w-0 flex-1 font-semibold", empty && "opacity-30")}
        numberOfLines={2}
        tone="default"
        variant="body"
      >
        {value}
      </ThemedText>
    </View>
  );
}

function DetailsNoteBlock({ label = "Note", value, empty }: DetailsNote) {
  return (
    <View className="gap-stack-compact pt-stack">
      <ThemedText tone="muted" variant="body">
        {label}
      </ThemedText>
      <View className="rounded-card border border-border-subtle bg-surface-sunken px-inline py-stack">
        <ThemedText
          className={empty ? "opacity-30" : undefined}
          tone={empty ? "muted" : "default"}
          variant="body"
        >
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

export function DetailsSection({
  title,
  fields,
  note,
  className,
}: DetailsSectionProps) {
  if (fields.length === 0 && !note) {
    return null;
  }

  return (
    <View className={cn("w-full", className)}>
      <ThemedText className="font-semibold" variant="body">
        {title}
      </ThemedText>

      {fields.length > 0 ? (
        <View className="mt-stack">
          {fields.map((field, index) => (
            <View key={`${field.label}-${index}`}>
              {index > 0 ? <DashedDivider /> : null}
              <DetailsRow {...field} />
            </View>
          ))}
        </View>
      ) : null}

      {note ? <DetailsNoteBlock {...note} /> : null}
    </View>
  );
}
