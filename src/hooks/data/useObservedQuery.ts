import { useEffect, useRef, useState } from "react";

type ObservableSubscription = {
  unsubscribe: () => void;
};

type ObserveWithColumnsSource = {
  observeWithColumns: (columns: string[]) => {
    subscribe: (observer: {
      next: (records: unknown[]) => void;
      error: (err: unknown) => void;
    }) => ObservableSubscription;
  };
};

export type UseObservedQueryResult<TData> = {
  data: TData;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Watermelon observeWithColumns → map → state, with cancel + generation guards
 * so stale async maps cannot overwrite newer emissions.
 *
 * `getQuery` / `mapRecords` may be unstable; only `enabled` + `deps` re-subscribe.
 */
export function useObservedQuery<TRecord, TData>({
  enabled,
  deps,
  getQuery,
  columns,
  mapRecords,
  emptyData,
}: {
  enabled: boolean;
  /** Extra effect dependencies (ids, flags, etc.). */
  deps: readonly unknown[];
  getQuery: () => ObserveWithColumnsSource;
  columns: readonly string[];
  mapRecords: (records: TRecord[]) => TData | Promise<TData>;
  emptyData: TData;
}): UseObservedQueryResult<TData> {
  const [data, setData] = useState<TData>(emptyData);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const getQueryRef = useRef(getQuery);
  const mapRecordsRef = useRef(mapRecords);
  const columnsRef = useRef(columns);
  const emptyDataRef = useRef(emptyData);
  getQueryRef.current = getQuery;
  mapRecordsRef.current = mapRecords;
  columnsRef.current = columns;
  emptyDataRef.current = emptyData;

  useEffect(() => {
    if (!enabled) {
      setData(emptyDataRef.current);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let generation = 0;
    setIsLoading(true);
    setError(null);

    const subscription = getQueryRef
      .current()
      .observeWithColumns([...columnsRef.current])
      .subscribe({
        next: (records) => {
          const requestId = ++generation;
          void Promise.resolve(
            mapRecordsRef.current(records as TRecord[]),
          ).then(
            (mapped) => {
              if (cancelled || requestId !== generation) {
                return;
              }

              setData(mapped);
              setIsLoading(false);
              setError(null);
            },
            (err) => {
              if (cancelled || requestId !== generation) {
                return;
              }

              setData(emptyDataRef.current);
              setIsLoading(false);
              setError(err instanceof Error ? err : new Error(String(err)));
            },
          );
        },
        error: (err) => {
          if (cancelled) {
            return;
          }

          setData(emptyDataRef.current);
          setIsLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps array is intentional
  }, [enabled, ...deps]);

  return { data, isLoading, error };
}

type FindAndObserveSource<TRecord> = {
  subscribe: (observer: {
    next: (record: TRecord) => void;
    error: (err: unknown) => void;
  }) => ObservableSubscription;
};

export type UseObservedRecordResult<TData> = {
  data: TData | null;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Watermelon findAndObserve (or similar single-record stream) → map → state.
 */
export function useObservedRecord<TRecord, TData>({
  enabled,
  deps,
  getObserve,
  map,
}: {
  enabled: boolean;
  deps: readonly unknown[];
  getObserve: () => FindAndObserveSource<TRecord>;
  map: (record: TRecord) => TData | Promise<TData>;
}): UseObservedRecordResult<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const getObserveRef = useRef(getObserve);
  const mapRef = useRef(map);
  getObserveRef.current = getObserve;
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let generation = 0;
    setIsLoading(true);
    setError(null);

    const subscription = getObserveRef.current().subscribe({
      next: (record) => {
        const requestId = ++generation;
        void Promise.resolve(mapRef.current(record)).then(
          (mapped) => {
            if (cancelled || requestId !== generation) {
              return;
            }

            setData(mapped);
            setIsLoading(false);
            setError(null);
          },
          (err) => {
            if (cancelled || requestId !== generation) {
              return;
            }

            setData(null);
            setIsLoading(false);
            setError(err instanceof Error ? err : new Error(String(err)));
          },
        );
      },
      error: (err) => {
        if (cancelled) {
          return;
        }

        setData(null);
        setIsLoading(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      },
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps array is intentional
  }, [enabled, ...deps]);

  return { data, isLoading, error };
}
