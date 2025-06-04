"use strict";
// Utility functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRetryConfig = exports.sleep = exports.lastWeek = exports.yesterday = exports.now = exports.parseError = exports.formatVolume = void 0;
exports.parseDate = parseDate;
exports.formatPair = formatPair;
exports.withRetry = withRetry;
/**
 * Format currency with appropriate suffix
 */
const formatVolume = (vol) => {
    if (vol >= 1000000000) {
        return `$${(vol / 1000000000).toFixed(2)}B`;
    }
    if (vol >= 1000000) {
        return `$${(vol / 1000000).toFixed(2)}M`;
    }
    if (vol >= 1000) {
        return `$${(vol / 1000).toFixed(2)}K`;
    }
    return `$${vol.toFixed(2)}`;
};
exports.formatVolume = formatVolume;
// Convert various date formats to Date object
function parseDate(input) {
    if (typeof input === 'number') {
        return new Date(input * 1000); // unix timestamp
    }
    return new Date(input);
}
// Format token pair display
function formatPair(token0, token1) {
    return `${token0}/${token1}`;
}
// Extract readable error message
const parseError = (err) => {
    var _a, _b;
    if ((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) {
        return err.response.data.message;
    }
    if (err === null || err === void 0 ? void 0 : err.message) {
        return err.message;
    }
    return 'Unknown error occurred';
};
exports.parseError = parseError;
// Timestamp utility functions
const now = () => Math.floor(Date.now() / 1000);
exports.now = now;
const yesterday = () => (0, exports.now)() - 86400;
exports.yesterday = yesterday;
const lastWeek = () => (0, exports.now)() - 86400 * 7;
exports.lastWeek = lastWeek;
// Async delay utility
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
exports.sleep = sleep;
/**
 * Default retry configuration
 */
exports.defaultRetryConfig = {
    maxRetries: 4,
    delaySequenceMs: [100, 500, 1000, 5000], // Explicit sequence as requested
    retryableStatuses: [408, 429, 500, 502, 503, 504]
};
/**
 * Execute an operation with retry and specified delays
 *
 * @param operation - The async operation to execute
 * @param config - Retry configuration
 * @returns Result of the operation
 * @throws Last error encountered if all retries fail
 */
async function withRetry(operation, config = {}) {
    var _a;
    const finalConfig = { ...exports.defaultRetryConfig, ...config };
    let lastError;
    // Try initial attempt plus retries
    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            // For attempts after the first one, wait using the specified delay
            if (attempt > 0) {
                const delayIndex = attempt - 1; // Adjust index to match delaySequence
                const delay = finalConfig.delaySequenceMs[delayIndex] ||
                    finalConfig.delaySequenceMs[finalConfig.delaySequenceMs.length - 1];
                await (0, exports.sleep)(delay);
            }
            return await operation();
        }
        catch (error) {
            lastError = error;
            // Only retry on specified status codes or network errors
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) &&
                !finalConfig.retryableStatuses.includes(error.response.status)) {
                throw error;
            }
            // Don't continue if this was the last attempt
            if (attempt === finalConfig.maxRetries) {
                throw error;
            }
        }
    }
    throw lastError;
}
