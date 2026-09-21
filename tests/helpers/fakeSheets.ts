/**
 * In-memory fake for `src/lib/data/sheetsClient.ts`, used to test the Data Access
 * Layer without touching the real Google Sheets API.
 *
 * It mirrors the real client's observable semantics:
 *  - `readTab` always returns the header row at index 0, followed by data rows.
 *  - Every stored cell is coerced to a string (Sheets only ever stores strings),
 *    so the DAL's `Number()` / `parseInt()` parsing is genuinely exercised.
 *  - `rowIndex` is 1-based and includes the header row (row 1 === header).
 */

export type TabStore = Record<string, string[][]>;

/** Data rows only (header row is injected by `readTab`). */
export const store: TabStore = {};

function cell(v: unknown): string {
  return v === undefined || v === null ? "" : String(v);
}

/** Clears every tab. Call in `beforeEach`. */
export function resetStore(): void {
  for (const tab of Object.keys(store)) {
    delete store[tab];
  }
}

/**
 * Replaces the data rows of a single tab.
 * Mirrors the real client, which seeds a header row and appends data rows below it.
 */
export function seedRows(tab: string, rows: unknown[][]): void {
  store[tab] = rows.map((row) => row.map(cell));
}

/** Current data rows for a tab (without the header row). */
export function dataRows(tab: string): string[][] {
  return store[tab] || [];
}

/**
 * Builds the module surface that replaces `sheetsClient`.
 * `headers` should be the real `TAB_HEADERS` from `sheetsClient.ts`.
 */
export function buildFakeSheetsModule(headers: Record<string, string[]>) {
  return {
    TAB_HEADERS: headers,

    async readTab(tabName: string): Promise<string[][]> {
      const header = headers[tabName] || ["id"];
      return [header.slice(), ...(store[tabName] || []).map((r) => r.slice())];
    },

    async appendRow(tabName: string, values: unknown[]): Promise<void> {
      if (!store[tabName]) store[tabName] = [];
      store[tabName].push(values.map(cell));
    },

    async updateRow(tabName: string, rowIndex: number, values: unknown[]): Promise<void> {
      const rows = store[tabName] || [];
      if (rowIndex < 2 || rows.length < rowIndex - 1) {
        throw new Error(`Row ${rowIndex} does not exist in ${tabName}`);
      }
      rows[rowIndex - 2] = values.map(cell);
    },

    async deleteRow(tabName: string, rowIndex: number): Promise<void> {
      if (rowIndex < 2) {
        throw new Error("Cannot delete header row");
      }
      const rows = store[tabName] || [];
      if (rows.length < rowIndex - 1) {
        throw new Error(`Row ${rowIndex} does not exist in ${tabName}`);
      }
      rows.splice(rowIndex - 2, 1);
    },
  };
}
