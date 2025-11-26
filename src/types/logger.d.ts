/**
 * Type declarations for @guinetik/logger
 * @see https://www.npmjs.com/package/@guinetik/logger
 */

declare module '@guinetik/logger' {
  export interface LoggerOptions {
    /** Whether logging is enabled (default: true) */
    enabled?: boolean;
    /** Log level threshold (default: 'info') */
    level?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    /** Prefix/component name shown in log messages */
    prefix?: string;
    /** Whether to redact potential secrets (default: false) */
    redactSecrets?: boolean;
    /** LoggingManager instance for component filtering */
    loggingManager?: LoggingManager;
    /** Console object to use (default: console) */
    console?: Console;
  }

  export class Logger {
    constructor(options?: LoggerOptions);

    /** Log an error message */
    error(message: string, ...args: unknown[]): void;
    /** Log a warning message */
    warn(message: string, ...args: unknown[]): void;
    /** Log an info message */
    info(message: string, ...args: unknown[]): void;
    /** Log a general message */
    log(message: string, ...args: unknown[]): void;
    /** Log a debug message */
    debug(message: string, ...args: unknown[]): void;
    /** Log a trace message (with secret redaction) */
    trace(message: string, ...args: unknown[]): void;
    /** Display data in table format */
    table(data: unknown, columns?: string[]): void;
    /** Start a console group */
    group(label: string): void;
    /** Start a collapsed console group */
    groupCollapsed(label: string): void;
    /** End current console group */
    groupEnd(): void;
    /** Start a timer */
    time(label: string): void;
    /** End a timer and log duration */
    timeEnd(label: string): void;
    /** Set log level */
    setLevel(level: string): void;
    /** Enable logging */
    enable(): void;
    /** Disable logging */
    disable(): void;
    /** Check if logging is enabled */
    isEnabled(): boolean;
  }

  export interface StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  }

  export class LoggingManager {
    constructor(options?: { storage?: StorageAdapter; console?: Console });

    /** Enable logging for specific components */
    enable(...components: string[]): void;
    /** Disable logging for specific components */
    disable(...components: string[]): void;
    /** Enable logging for all components */
    enableAll(): void;
    /** Disable logging for all components (errors still show) */
    disableAll(): void;
    /** Show current logging status */
    status(): void;
    /** List all registered components */
    listComponents(): void;
    /** Check if a component is enabled */
    isComponentEnabled(component: string): boolean;
    /** Register a component for tracking */
    registerComponent(component: string): void;
  }

  export const LOG_LEVELS: {
    ERROR: 1;
    WARN: 2;
    INFO: 3;
    DEBUG: 4;
    TRACE: 5;
  };

  export const DEFAULT_LOG_LEVEL: string;

  /**
   * Creates a new Logger instance with the global LoggingManager
   * @param options - Logger configuration options
   * @returns A configured Logger instance
   */
  export function createLogger(options?: LoggerOptions): Logger;

  /** Creates a storage adapter (localStorage or memory fallback) */
  export function createStorageAdapter(): StorageAdapter;

  /** Global LoggingManager instance (exposed as window.logFilter in browser) */
  export const globalLoggingManager: LoggingManager;
}
