/**
 * UX Enhancements
 * Implements undo/redo, version history, and comparison views
 */

/**
 * Undo/Redo Stack
 */
export interface HistoryState<T> {
  data: T;
  timestamp: Date;
  description: string;
  metadata?: Record<string, unknown>;
}

export class UndoRedoStack<T> {
  private undoStack: HistoryState<T>[] = [];
  private redoStack: HistoryState<T>[] = [];
  private maxStackSize: number;

  constructor(maxStackSize: number = 50) {
    this.maxStackSize = maxStackSize;
  }

  push(data: T, description: string, metadata?: Record<string, unknown>): void {
    this.undoStack.push({
      data,
      timestamp: new Date(),
      description,
      metadata,
    });

    // Clear redo stack when new action is performed
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  undo(): HistoryState<T> | null {
    if (this.undoStack.length === 0) return null;

    const state = this.undoStack.pop()!;
    this.redoStack.push(state);
    return state;
  }

  redo(): HistoryState<T> | null {
    if (this.redoStack.length === 0) return null;

    const state = this.redoStack.pop()!;
    this.undoStack.push(state);
    return state;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getHistory(): HistoryState<T>[] {
    return [...this.undoStack];
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

/**
 * Version History
 */
export interface VersionSnapshot<T> {
  versionId: string;
  data: T;
  timestamp: Date;
  author?: string;
  description: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export class VersionHistory<T> {
  private versions: VersionSnapshot<T>[] = [];
  private currentVersion: number = -1;
  private maxVersions: number;

  constructor(maxVersions: number = 100) {
    this.maxVersions = maxVersions;
  }

  createVersion(
    data: T,
    description: string,
    author?: string,
    tags?: string[],
    metadata?: Record<string, unknown>
  ): string {
    const versionId = `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.versions.push({
      versionId,
      data,
      timestamp: new Date(),
      author,
      description,
      tags,
      metadata,
    });

    this.currentVersion = this.versions.length - 1;

    // Limit versions
    if (this.versions.length > this.maxVersions) {
      this.versions.shift();
      this.currentVersion--;
    }

    return versionId;
  }

  getVersion(versionId: string): VersionSnapshot<T> | null {
    return this.versions.find((v) => v.versionId === versionId) || null;
  }

  getCurrentVersion(): VersionSnapshot<T> | null {
    if (this.currentVersion < 0) return null;
    return this.versions[this.currentVersion] || null;
  }

  restoreVersion(versionId: string): VersionSnapshot<T> | null {
    const index = this.versions.findIndex((v) => v.versionId === versionId);
    if (index === -1) return null;

    this.currentVersion = index;
    return this.versions[index];
  }

  getVersions(tag?: string): VersionSnapshot<T>[] {
    if (!tag) return [...this.versions];
    return this.versions.filter((v) => v.tags?.includes(tag));
  }

  deleteVersion(versionId: string): boolean {
    const index = this.versions.findIndex((v) => v.versionId === versionId);
    if (index === -1) return false;

    this.versions.splice(index, 1);
    if (this.currentVersion >= this.versions.length) {
      this.currentVersion = this.versions.length - 1;
    }

    return true;
  }

  getVersionCount(): number {
    return this.versions.length;
  }

  clear(): void {
    this.versions = [];
    this.currentVersion = -1;
  }
}

/**
 * Comparison View
 */
export interface ComparisonDiff<T> {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  type: "added" | "removed" | "modified";
}

export function compareVersions<T extends Record<string, unknown>>(
  version1: T,
  version2: T
): ComparisonDiff<T>[] {
  const diffs: ComparisonDiff<T>[] = [];

  // Check for modified and removed fields
  for (const [key, value] of Object.entries(version1)) {
    if (!(key in version2)) {
      diffs.push({
        field: key,
        oldValue: value,
        newValue: undefined,
        type: "removed",
      });
    } else if (JSON.stringify(value) !== JSON.stringify(version2[key])) {
      diffs.push({
        field: key,
        oldValue: value,
        newValue: version2[key],
        type: "modified",
      });
    }
  }

  // Check for added fields
  for (const [key, value] of Object.entries(version2)) {
    if (!(key in version1)) {
      diffs.push({
        field: key,
        oldValue: undefined,
        newValue: value,
        type: "added",
      });
    }
  }

  return diffs;
}

/**
 * Batch Operations
 */
export interface BatchOperation<T> {
  id: string;
  items: T[];
  operation: (item: T) => Promise<unknown>;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number;
  results: unknown[];
  errors: string[];
}

export class BatchOperationManager<T> {
  private operations: Map<string, BatchOperation<T>> = new Map();

  async executeBatch(
    items: T[],
    operation: (item: T) => Promise<unknown>,
    batchId?: string
  ): Promise<string> {
    const id = batchId || `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const batchOp: BatchOperation<T> = {
      id,
      items,
      operation,
      status: "pending",
      progress: 0,
      results: [],
      errors: [],
    };

    this.operations.set(id, batchOp);

    // Execute batch asynchronously
    this.processBatch(id);

    return id;
  }

  private async processBatch(batchId: string): Promise<void> {
    const batch = this.operations.get(batchId);
    if (!batch) return;

    batch.status = "in_progress";

    for (let i = 0; i < batch.items.length; i++) {
      try {
        const result = await batch.operation(batch.items[i]);
        batch.results.push(result);
      } catch (error) {
        batch.errors.push(
          error instanceof Error ? error.message : String(error)
        );
      }

      batch.progress = Math.round(((i + 1) / batch.items.length) * 100);
    }

    batch.status = batch.errors.length === 0 ? "completed" : "failed";
  }

  getBatchStatus(batchId: string): BatchOperation<T> | null {
    return this.operations.get(batchId) || null;
  }

  getBatchResult(batchId: string): { results: unknown[]; errors: string[] } | null {
    const batch = this.operations.get(batchId);
    if (!batch) return null;

    return {
      results: batch.results,
      errors: batch.errors,
    };
  }

  cancelBatch(batchId: string): boolean {
    const batch = this.operations.get(batchId);
    if (!batch) return false;

    if (batch.status === "in_progress") {
      batch.status = "failed";
      batch.errors.push("Batch cancelled by user");
      return true;
    }

    return false;
  }

  getAllBatches(): BatchOperation<T>[] {
    return Array.from(this.operations.values());
  }

  clearCompleted(): void {
    for (const [id, batch] of this.operations.entries()) {
      if (batch.status === "completed" || batch.status === "failed") {
        this.operations.delete(id);
      }
    }
  }
}

/**
 * Collaborative Features
 */
export interface Change {
  id: string;
  userId: number;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
  description: string;
}

export class ChangeLog {
  private changes: Change[] = [];
  private maxChanges: number;

  constructor(maxChanges: number = 1000) {
    this.maxChanges = maxChanges;
  }

  recordChange(
    userId: number,
    field: string,
    oldValue: unknown,
    newValue: unknown,
    description: string
  ): string {
    const id = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.changes.push({
      id,
      userId,
      field,
      oldValue,
      newValue,
      timestamp: new Date(),
      description,
    });

    // Limit changes
    if (this.changes.length > this.maxChanges) {
      this.changes.shift();
    }

    return id;
  }

  getChanges(userId?: number, field?: string): Change[] {
    let filtered = this.changes;

    if (userId) {
      filtered = filtered.filter((c) => c.userId === userId);
    }

    if (field) {
      filtered = filtered.filter((c) => c.field === field);
    }

    return filtered;
  }

  getChangesSince(timestamp: Date): Change[] {
    return this.changes.filter((c) => c.timestamp > timestamp);
  }

  getChangeCount(): number {
    return this.changes.length;
  }

  clear(): void {
    this.changes = [];
  }
}

/**
 * Notifications for UX
 */
export enum NotificationType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
  PROGRESS = "progress",
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss after duration (ms)
  action?: {
    label: string;
    callback: () => void;
  };
}

export class NotificationManager {
  private notifications: Notification[] = [];
  private subscribers: Set<(notification: Notification) => void> = new Set();

  notify(
    type: NotificationType,
    title: string,
    message: string,
    duration?: number,
    action?: { label: string; callback: () => void }
  ): string {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      duration,
      action,
    };

    this.notifications.push(notification);
    this.subscribers.forEach((callback) => callback(notification));

    // Auto-remove after duration
    if (duration) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  subscribe(callback: (notification: Notification) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  clear(): void {
    this.notifications = [];
  }
}

export const notificationManager = new NotificationManager();
