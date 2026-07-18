import { Stack, useLocalSearchParams } from "expo-router";

import { MockTestScreen } from "@/features/mock-test/MockTestScreen";
import type { MockTestType } from "@/types/mock-test";

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default function TestAttemptRoute() {
  const params = useLocalSearchParams<{
    type?: string | string[];
    id?: string | string[];
    source?: string | string[];
  }>();

  const rawType = firstParam(params.type);
  const resourceId = firstParam(params.id);
  const source = firstParam(params.source);
  const type: MockTestType = rawType === "pyq" ? "pyq" : "mock";

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <MockTestScreen
        type={type}
        resourceId={resourceId}
        showPromo={type === "mock" && source === "free-mock"}
      />
    </>
  );
}
