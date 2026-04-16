type LogLevel = "INFO" | "WARN" | "ERROR" | "SECURITY" | "AUDIT";

interface LogContext {
  [key: string]: unknown;
}

class MedCannLabAuditLogger {
  private static log(level: LogLevel, event: string, context?: LogContext) {
    const entry = {
      level,
      event,
      context: context || {},
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === "production" || import.meta.env?.PROD) {
      console.log(JSON.stringify(entry));
    } else {
      let color = '';
      switch (level) {
        case 'INFO': color = 'color: #3b82f6'; break;     // Blue
        case 'WARN': color = 'color: #f59e0b'; break;     // Amber
        case 'ERROR': color = 'color: #ef4444'; break;    // Red
        case 'SECURITY': color = 'color: #8b5cf6'; break; // Purple
        case 'AUDIT': color = 'color: #10b981'; break;    // Emerald
      }
      
      console.log(
        `%c[${entry.level}] %c${entry.event}`, 
        `font-weight: bold; ${color}`,
        'font-weight: normal; color: inherit',
        Object.keys(entry.context).length > 0 ? entry.context : ''
      );
    }
  }

  static info(event: string, context?: LogContext) {
    this.log("INFO", event, context);
  }

  static warn(event: string, context?: LogContext) {
    this.log("WARN", event, context);
  }

  static error(event: string, context?: LogContext) {
    this.log("ERROR", event, context);
  }

  static security(event: string, context?: LogContext) {
    this.log("SECURITY", event, context);
  }

  static audit(event: string, context?: LogContext) {
    this.log("AUDIT", event, context);
  }
}

export default MedCannLabAuditLogger;
