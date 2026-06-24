import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";

export const useBootstrap = () => {
  useEffect(() => {
    const init = async () => {
      const token = await SecureStore.getItemAsync("accessToken");

      if (token) {
        console.log("User already logged in");
      }
    };

    init();
  }, []);
};
