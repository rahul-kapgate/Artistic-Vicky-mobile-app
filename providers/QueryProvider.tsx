import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React, { ReactNode, useEffect } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /*
       * Queries stay fresh for five minutes.
       * During that period React Query can use existing data
       * without immediately requesting it again.
       */
      staleTime: FIVE_MINUTES,

      /*
       * Keep inactive query data for one day.
       * This should be equal to or greater than persisted maxAge.
       */
      gcTime: ONE_DAY,

      /*
       * Pause queries when offline.
       * They continue automatically after reconnection.
       */
      networkMode: "online",

      refetchOnReconnect: true,
      refetchOnWindowFocus: true,

      /*
       * Do not keep retrying normal 4xx responses.
       * Retry temporary server/network failures twice.
       */
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;

        if (status && status >= 400 && status < 500) {
          return false;
        }

        return failureCount < 2;
      },

      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },

    mutations: {
      networkMode: "online",
      retry: false,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "ARTISTIC_VICKY_QUERY_CACHE_V1",
  throttleTime: 1000,
});

type QueryProviderProps = {
  children: ReactNode;
};

export default function QueryProvider({ children }: QueryProviderProps) {
  useEffect(() => {
    function handleAppStateChange(status: AppStateStatus) {
      if (Platform.OS !== "web") {
        focusManager.setFocused(status === "active");
      }
    }

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,

        // Remove persisted data after one day.
        maxAge: ONE_DAY,

        /*
         * Change this value whenever the cached data structure
         * changes and the old cache should be deleted.
         */
        buster: "artistic-vicky-cache-v1",

        dehydrateOptions: {
          /*
           * Production safety:
           * Only queries containing meta.persist === true
           * will be stored in AsyncStorage.
           */
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" && query.meta?.persist === true,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
