import { useMemo, useCallback } from "react";
import { useDemo } from "@/hooks/useDemo";
import type { Notification } from "@/types/inventory";

interface QueryResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
}

export function useNotifications(): QueryResult<Notification[]> {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) {
      return { data: demoStore.getNotifications(), isLoading: false, error: null };
    }
    return { data: [] as Notification[], isLoading: false, error: null };
  }, [isDemo, demoStore, version]);
}

export function useUnreadCount(): number {
  const { isDemo, demoStore, version } = useDemo();
  return useMemo(() => {
    if (isDemo && demoStore) return demoStore.getUnreadCount();
    return 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, demoStore, version]);
}

export function useMarkAsRead() {
  const { demoStore, bumpVersion } = useDemo();
  return useCallback(
    (id: string) => {
      demoStore?.markAsRead(id);
      bumpVersion();
    },
    [demoStore, bumpVersion],
  );
}

export function useMarkAllAsRead() {
  const { demoStore, bumpVersion } = useDemo();
  return useCallback(() => {
    demoStore?.markAllAsRead();
    bumpVersion();
  }, [demoStore, bumpVersion]);
}

export function useDismissNotification() {
  const { demoStore, bumpVersion } = useDemo();
  return useCallback(
    (id: string) => {
      demoStore?.dismissNotification(id);
      bumpVersion();
    },
    [demoStore, bumpVersion],
  );
}
