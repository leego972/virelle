/**
 * billing/callback.tsx
 *
 * Handles the Stripe checkout return deep link:
 *   virelle://billing/success?subscription=success
 *   virelle://billing/cancel?subscription=canceled
 *
 * Stripe redirects here after the user completes (or cancels) a checkout
 * session opened from the mobile subscription screen.
 */
import { ThemedView } from "@/components/themed-view";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";

type Status = "processing" | "success" | "canceled" | "error";

export default function BillingCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subscription?: string; status?: string }>();
  const [status, setStatus] = useState<Status>("processing");

  // Invalidate the subscription status query so the home screen refreshes
  const utils = trpc.useUtils();

  useEffect(() => {
    const subscription = params.subscription || params.status;

    if (subscription === "success") {
      // Invalidate credits balance so the home screen refreshes with the new tier
      utils.credits.balance.invalidate().catch(() => {});
      // Also invalidate the auth.me query so the home screen picks up the new tier
      utils.auth.me.invalidate().catch(() => {});
      setStatus("success");
      setTimeout(() => {
        router.replace("/(tabs)" as never);
      }, 2000);
    } else if (subscription === "canceled") {
      setStatus("canceled");
      setTimeout(() => {
        router.replace("/tool/subscription" as never);
      }, 2000);
    } else {
      setStatus("error");
      setTimeout(() => {
        router.replace("/(tabs)" as never);
      }, 3000);
    }
  }, [params.subscription, params.status]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="mt-4 text-base text-center text-foreground">
              Confirming your subscription...
            </Text>
          </>
        )}

        {status === "success" && (
          <>
            <Text className="text-5xl mb-4">🎬</Text>
            <Text className="text-2xl font-bold text-center text-foreground mb-2">
              Welcome to Virelle Studios
            </Text>
            <Text className="text-base text-center text-muted-foreground">
              Your subscription is active. Redirecting to your dashboard...
            </Text>
          </>
        )}

        {status === "canceled" && (
          <>
            <Text className="text-5xl mb-4">↩️</Text>
            <Text className="text-xl font-bold text-center text-foreground mb-2">
              Checkout Canceled
            </Text>
            <Text className="text-base text-center text-muted-foreground">
              No charge was made. Taking you back to the subscription page...
            </Text>
          </>
        )}

        {status === "error" && (
          <>
            <Text className="text-5xl mb-4">⚠️</Text>
            <Text className="text-xl font-bold text-center text-foreground mb-2">
              Something went wrong
            </Text>
            <Text className="text-base text-center text-muted-foreground">
              Please check your subscription status in the app.
            </Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
