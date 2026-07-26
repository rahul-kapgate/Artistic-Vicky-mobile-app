import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type NetworkContextValue = {
  isOnline: boolean;
  isChecking: boolean;
  refreshNetworkStatus: () => Promise<boolean>;
};

const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined,
);

function getIsOnline(state: NetInfoState): boolean {
  /*
   * isConnected:
   * Device has a network connection.
   *
   * isInternetReachable:
   * That connection can actually reach the internet.
   *
   * null means NetInfo is still checking, so do not immediately
   * mark the device offline and cause an offline-banner flash.
   */
  return state.isConnected === true && state.isInternetReachable !== false;
}

type NetworkProviderProps = {
  children: ReactNode;
};

export default function NetworkProvider({ children }: NetworkProviderProps) {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  const updateNetworkState = useCallback((state: NetInfoState) => {
    const online = getIsOnline(state);

    setNetworkState(state);

    // Tell React Query whether requests should run or pause.
    onlineManager.setOnline(online);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Get initial network state.
    NetInfo.fetch()
      .then((state) => {
        if (isMounted) {
          updateNetworkState(state);
        }
      })
      .catch((error) => {
        console.warn("Unable to read initial network state", error);
      });

    // Listen for Wi-Fi/mobile-data changes.
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (isMounted) {
        updateNetworkState(state);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [updateNetworkState]);

  const refreshNetworkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();

      updateNetworkState(state);

      return getIsOnline(state);
    } catch (error) {
      console.warn("Unable to refresh network state", error);
      return false;
    }
  }, [updateNetworkState]);

  const value = useMemo<NetworkContextValue>(
    () => ({
      // Treat the initial unknown state as online to avoid UI flashing.
      isOnline: networkState ? getIsOnline(networkState) : true,
      isChecking: networkState === null,
      refreshNetworkStatus,
    }),
    [networkState, refreshNetworkStatus],
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error("useNetwork must be used inside NetworkProvider");
  }

  return context;
}
