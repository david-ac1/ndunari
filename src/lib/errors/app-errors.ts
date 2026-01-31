/**
 * Application Error Types
 * Typed error hierarchy for proper error handling and tracking
 */

// === Base Error Types ===

export type AppError =
    | NetworkError
    | AuthError
    | ValidationError
    | DatabaseError
    | AIServiceError
    | TimeoutError
    | UnknownError;

export interface NetworkError {
    type: 'network';
    message: string;
    statusCode?: number;
    url?: string;
}

export interface AuthError {
    type: 'auth';
    message: string;
    code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'SESSION_EXPIRED';
}

export interface ValidationError {
    type: 'validation';
    message: string;
    field?: string;
    errors?: Record<string, string[]>;
}

export interface DatabaseError {
    type: 'database';
    message: string;
    code?: string;
    table?: string;
}

export interface AIServiceError {
    type: 'ai_service';
    message: string;
    service: 'gemini' | 'forensic_eye' | 'sentinel' | 'stewardship';
    retryable: boolean;
}

export interface TimeoutError {
    type: 'timeout';
    message: string;
    operation?: string;
}

export interface UnknownError {
    type: 'unknown';
    message: string;
    raw: unknown;
}

// === Error Normalization ===

/**
 * Converts any thrown value into a typed AppError
 * Use this in catch blocks instead of `catch (error: any)`
 */
export function normalizeError(error: unknown): AppError {
    // Already an AppError
    if (isAppError(error)) {
        return error;
    }

    // Standard Error object
    if (error instanceof Error) {
        // Check for specific error patterns
        if (error.message.includes('fetch') || error.message.includes('network')) {
            return {
                type: 'network',
                message: error.message,
            };
        }

        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
            return {
                type: 'auth',
                message: 'Authentication required',
                code: 'UNAUTHORIZED',
            };
        }

        if (error.message.includes('Forbidden') || error.message.includes('403')) {
            return {
                type: 'auth',
                message: 'Access denied',
                code: 'FORBIDDEN',
            };
        }

        // Check for Supabase errors
        if ('code' in error && typeof (error as any).code === 'string') {
            return {
                type: 'database',
                message: error.message,
                code: (error as any).code,
            };
        }

        // Generic error
        return {
            type: 'unknown',
            message: error.message,
            raw: error,
        };
    }

    // String error
    if (typeof error === 'string') {
        return {
            type: 'unknown',
            message: error,
            raw: error,
        };
    }

    // Object with message
    if (error && typeof error === 'object' && 'message' in error) {
        return {
            type: 'unknown',
            message: String((error as any).message),
            raw: error,
        };
    }

    // Complete unknown
    return {
        type: 'unknown',
        message: 'An unexpected error occurred',
        raw: error,
    };
}

function isAppError(value: unknown): value is AppError {
    return (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        typeof (value as any).type === 'string'
    );
}

// === User-Friendly Messages ===

/**
 * Converts AppError to user-friendly message
 */
export function getUserMessage(error: AppError): string {
    switch (error.type) {
        case 'network':
            return 'Network connection failed. Please check your internet and try again.';
        case 'auth':
            if (error.code === 'SESSION_EXPIRED') {
                return 'Your session has expired. Please sign in again.';
            }
            return error.message || 'Authentication failed';
        case 'validation':
            return error.message;
        case 'database':
            return 'Database error occurred. Please try again.';
        case 'ai_service':
            return `AI service (${error.service}) is temporarily unavailable. ${error.retryable ? 'Retrying...' : 'Please try again later.'
                }`;
        case 'timeout':
            return error.operation
                ? `${error.operation} took too long. Please try again.`
                : 'Operation timed out. Please try again.';
        case 'unknown':
            return 'An unexpected error occurred. Please try again.';
    }
}

/**
 * Determines if an error should be reported to error tracking
 */
export function shouldReportError(error: AppError): boolean {
    // Don't report validation errors or expected auth errors
    if (error.type === 'validation') return false;
    if (error.type === 'auth' && error.code === 'UNAUTHORIZED') return false;

    return true;
}

/**
 * Logs error to console with appropriate level
 */
export function logError(error: AppError, context?: string): void {
    const prefix = context ? `[${context}]` : '[Error]';

    if (error.type === 'unknown' || error.type === 'database') {
        console.error(prefix, error.message, error);
    } else {
        console.warn(prefix, error.message, error);
    }

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (shouldReportError(error)) {
    //     reportToSentry(error, context);
    // }
}
