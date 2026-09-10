import type { Database } from "@nozbe/watermelondb";

type DispatcherResult = { value?: unknown; error?: unknown };

type SqliteDispatcher = {
  call: (
    name: string,
    args: unknown[],
    callback: (result: DispatcherResult) => void,
  ) => void;
};

/**
 * Best-effort close of a Watermelon JSI connection so the SQLite file can be unlinked.
 * Uses the private dispatcher `unsafeClose` (not part of the public adapter API).
 */
export async function closeClinicDatabase(database: Database): Promise<void> {
  const adapter = database.adapter as {
    _dispatcher?: SqliteDispatcher;
  };

  const dispatcher = adapter._dispatcher;
  if (!dispatcher?.call) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    try {
      dispatcher.call("unsafeClose", [], (result) => {
        if (result.error) {
          reject(result.error);
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
