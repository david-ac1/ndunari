/**
 * Request Queue for Rate Limit Management
 * Prevents quota exhaustion by queuing requests and enforcing delays
 */

interface QueuedRequest {
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: 'high' | 'normal' | 'low';
}

class RateLimitManager {
    private queue: QueuedRequest[] = [];
    private isProcessing = false;
    private lastRequestTime = 0;
    private readonly MIN_DELAY_MS = 1000; // 1 second between requests
    private readonly MAX_RETRIES = 3;
    private consecutiveErrors = 0;
    private backoffMultiplier = 1;

    /**
     * Add request to queue with priority
     */
    async enqueue<T>(
        fn: () => Promise<T>,
        priority: 'high' | 'normal' | 'low' = 'normal'
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const request: QueuedRequest = { fn, resolve, reject, priority };

            // Insert based on priority
            if (priority === 'high') {
                this.queue.unshift(request);
            } else if (priority === 'low') {
                this.queue.push(request);
            } else {
                // Normal priority - insert in middle
                const highPriorityCount = this.queue.filter(r => r.priority === 'high').length;
                this.queue.splice(highPriorityCount, 0, request);
            }

            console.log(`[RATE_LIMIT] Request queued (priority: ${priority}, queue size: ${this.queue.length})`);

            this.processQueue();
        });
    }

    /**
     * Process queued requests with rate limiting
     */
    private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const request = this.queue.shift()!;

            // Enforce minimum delay between requests
            const timeSinceLastRequest = Date.now() - this.lastRequestTime;
            const delay = Math.max(0, this.MIN_DELAY_MS * this.backoffMultiplier - timeSinceLastRequest);

            if (delay > 0) {
                console.log(`[RATE_LIMIT] Waiting ${delay}ms before next request...`);
                await this.sleep(delay);
            }

            try {
                this.lastRequestTime = Date.now();
                const result = await request.fn();
                request.resolve(result);

                // Success - reduce backoff
                this.consecutiveErrors = 0;
                this.backoffMultiplier = Math.max(1, this.backoffMultiplier * 0.8);

            } catch (error: any) {
                // Check if it's a rate limit error
                if (this.isRateLimitError(error)) {
                    console.error(`[RATE_LIMIT] Rate limit hit! (consecutive errors: ${this.consecutiveErrors + 1})`);

                    this.consecutiveErrors++;
                    this.backoffMultiplier = Math.min(10, this.backoffMultiplier * 2);

                    // Extract retry delay from error if available
                    const retryDelay = this.extractRetryDelay(error);
                    if (retryDelay) {
                        console.log(`[RATE_LIMIT] API requested ${retryDelay}s wait. Pausing queue...`);
                        await this.sleep(retryDelay * 1000);
                    }

                    // Re-queue the request if under max retries
                    if (this.consecutiveErrors < this.MAX_RETRIES) {
                        console.log(`[RATE_LIMIT] Re-queuing request (attempt ${this.consecutiveErrors + 1}/${this.MAX_RETRIES})`);
                        this.queue.unshift(request);
                    } else {
                        request.reject(new Error(
                            `Rate limit exceeded after ${this.MAX_RETRIES} attempts. Please wait before trying again.`
                        ));
                    }
                } else {
                    // Non-rate-limit error
                    request.reject(error);
                }
            }
        }

        this.isProcessing = false;
    }

    /**
     * Check if error is a rate limit error
     */
    private isRateLimitError(error: any): boolean {
        const message = error?.message?.toLowerCase() || '';
        return message.includes('rate limit') ||
            message.includes('quota') ||
            message.includes('429') ||
            error?.status === 429;
    }

    /**
     * Extract retry delay from error response
     */
    private extractRetryDelay(error: any): number | null {
        try {
            const message = error?.message || '';

            // Look for "retry in Xs" pattern
            const retryMatch = message.match(/retry in (\d+)\.?\d*s/i);
            if (retryMatch) {
                return parseInt(retryMatch[1]);
            }

            // Look for errorDetails with retryDelay
            if (error?.errorDetails) {
                const retryInfo = error.errorDetails.find((detail: any) =>
                    detail['@type']?.includes('RetryInfo')
                );
                if (retryInfo?.retryDelay) {
                    return parseInt(retryInfo.retryDelay.replace('s', ''));
                }
            }
        } catch (e) {
            console.warn('[RATE_LIMIT] Failed to extract retry delay:', e);
        }

        return null;
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current queue status
     */
    getStatus(): { queueLength: number; isProcessing: boolean; backoffMultiplier: number } {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            backoffMultiplier: this.backoffMultiplier
        };
    }

    /**
     * Clear queue (emergency stop)
     */
    clearQueue() {
        console.log(`[RATE_LIMIT] Clearing queue (${this.queue.length} requests discarded)`);
        this.queue.forEach(req => req.reject(new Error('Queue cleared')));
        this.queue = [];
    }
}

// Global singleton instance
export const rateLimitManager = new RateLimitManager();
