import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { trpc } from "@/lib/trpc";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers for push notifications, saves the Expo push token to the server,
 * and sets up foreground/response listeners.
 *
 * Must be called from a component that is rendered after the user is authenticated.
 * On web or simulators, registration is skipped gracefully.
 */
export function usePushNotifications(isAuthenticated: boolean) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const registerMutation = trpc.auth.registerPushToken.useMutation();

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;

    async function register() {
      try {
        // Android requires a notification channel
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("virelle-default", {
            name: "Virelle Studios",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0a7ea4",
          });
        }

        // Only physical devices can receive push notifications
        if (!Device.isDevice) {
          console.log("[PushNotifications] Skipping: not a physical device");
          return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        setPermissionStatus(existingStatus);
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          setPermissionStatus(finalStatus);
        }

        if (finalStatus !== "granted") {
          console.log("[PushNotifications] Permission denied");
          return;
        }

        // Get the Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;
        setExpoPushToken(token);

        // Save to server
        registerMutation.mutate({ token });
        console.log("[PushNotifications] Registered:", token);
      } catch (error) {
        console.warn("[PushNotifications] Registration failed:", error);
      }
    }

    register();

    // Listen for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[PushNotifications] Received:", notification.request.content.title);
    });

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("[PushNotifications] Tapped:", data);
      // Future: navigate to relevant screen based on data.screen
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  return { expoPushToken, permissionStatus };
}
