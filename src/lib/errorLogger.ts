// Error logging utility for better debugging
interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  additionalInfo?: any;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];
  private maxLogs = 50;

  private constructor() {
    this.setupGlobalErrorHandler();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private setupGlobalErrorHandler() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), {
        type: 'Unhandled Error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        {
          type: 'Promise Rejection',
          reason: event.reason,
        }
      );
    });
  }

  logError(error: Error, additionalInfo?: any) {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalInfo,
    };

    this.logs.push(errorLog);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorLog);
    }

    // In production, you would send this to your error tracking service
    // Example: this.sendToErrorTrackingService(errorLog);
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Send errors to backend (implement as needed)
  private async sendToErrorTrackingService(errorLog: ErrorLog) {
    if (import.meta.env.PROD) {
      try {
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(errorLog),
        // });
      } catch (e) {
        // Silently fail - don't want error logging to cause more errors
      }
    }
  }
}

// Initialize error logger
export const errorLogger = ErrorLogger.getInstance();

// Export a helper function for manual error logging
export const logError = (error: Error, context?: any) => {
  errorLogger.logError(error, context);
};
