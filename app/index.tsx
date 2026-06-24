import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");

        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  if (loading) {
    return null; // Splash screen later
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/landing" />;
}
