/**
 * Date utility service for handling IST (Indian Standard Time) conversions
 * IST is UTC+5:30
 */
export class DateUtil {
  private static readonly IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

  /**
   * Convert a datetime-local string (YYYY-MM-DDTHH:mm) to IST format for backend
   * The input is treated as IST time and converted to UTC for storage
   * Returns datetime-local format (YYYY-MM-DDTHH:mm) which backend will treat as IST
   */
  static convertDateTimeLocalToIST(dateTimeLocal: string): string {
    if (!dateTimeLocal) {
      return dateTimeLocal;
    }

    // If the string already has timezone info, extract just the datetime-local part
    if (dateTimeLocal.includes('Z')) {
      // Extract datetime-local from ISO string
      return dateTimeLocal.slice(0, 16);
    }
    
    if (/[+-]\d{2}:?\d{2}$/.test(dateTimeLocal)) {
      // Extract datetime-local from string with timezone
      const match = dateTimeLocal.match(/^(.+)[+-]\d{2}:?\d{2}$/);
      if (match) {
        return match[1].slice(0, 16);
      }
    }

    // Return datetime-local format (backend will treat it as IST)
    return dateTimeLocal;
  }

  /**
   * Convert a UTC date from backend to datetime-local format for input field
   * The date stored in DB is UTC, we need to convert it to IST for display
   */
  static convertDateToDateTimeLocal(date: Date | string): string {
    if (!date) {
      return '';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    // The date from backend is in UTC
    // To convert UTC to IST, we add the IST offset
    // Then format it for datetime-local input (which expects local time, but we treat it as IST)
    const utcTime = dateObj.getTime();
    const istTime = utcTime + this.IST_OFFSET_MS;
    const istDate = new Date(istTime);
    
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    // Use UTC methods since we've already adjusted for IST
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const hours = String(istDate.getUTCHours()).padStart(2, '0');
    const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Get current date and time in IST as datetime-local format
   */
  static getCurrentISTDateTimeLocal(): string {
    const now = new Date();
    return this.convertDateToDateTimeLocal(now);
  }

  /**
   * Format a date for display in IST timezone
   */
  static formatDateIST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    if (!date) {
      return '';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    // Convert to IST
    const istDate = new Date(dateObj.getTime() - this.IST_OFFSET_MS);
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    };

    return istDate.toLocaleString('en-IN', { ...defaultOptions, ...options });
  }

  /**
   * Check if a date string is in datetime-local format
   */
  static isDateTimeLocalFormat(dateString: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString);
  }
}

