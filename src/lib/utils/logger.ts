type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (process.env.NODE_ENV === "production") {
      // 本番環境: JSON形式でログ出力（外部ログサービスへ送信可能）
      console.log(JSON.stringify(logEntry));
    } else {
      // 開発環境: 読みやすい形式
      console[level === "debug" ? "log" : level](
        `[${timestamp}] ${level.toUpperCase()}: ${message}`,
        context || "",
      );
    }
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, context);
    }
  }
}

export const logger = new Logger();
