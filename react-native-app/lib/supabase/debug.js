// Debug utilities for Supabase client
export const DEBUG = __DEV__; // True in development, false in production

/**
 * Log messages only in debug mode
 * 
 * @param  {...any} args - Arguments to log
 */
export const debugLog = (...args) => {
    if (DEBUG) {
        console.log('[Supabase Debug]', ...args);
    }
};

/**
 * Request interceptor for debugging
 * 
 * @param {Object} req - Request object
 * @returns {Object} - Modified request object
 */
export const requestInterceptor = (req) => {
    if (DEBUG) {
        debugLog('Request:', {
            method: req.method,
            url: req.url,
            headers: req.headers,
            // Don't log body -> security reasons in production
            ...(DEBUG && { body: req.body }),
        });
    }
    return req;
};

/**
 * Response interceptor for debugging
 * 
 * @param {Object} res - Response object
 * @returns {Object} - Modified response object
 */
export const responseInterceptor = (res) => {
    if (DEBUG) {
        debugLog('Response:', {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
            // Don't log full response body -> performance reasons
        });
    }
    return res;
};

/**
 * Setup global fetch interceptors for debugging
 */
export const setupFetchInterceptors = () => {
    if (DEBUG) {
        try {
            const originalFetch = global.fetch;
            global.fetch = async (...args) => {
                const [url, config = {}] = args;
                const request = { url, ...config };

                requestInterceptor(request);

                try {
                    const response = await originalFetch(url, config);
                    responseInterceptor(response.clone());
                    return response;
                } catch (error) {
                    debugLog('Fetch Error:', error);
                    throw error;
                }
            };
            debugLog('Fetch interceptors set up successfully');
        } catch (error) {
            debugLog('Error setting up fetch interceptors:', error);
        }
    }
};

/**
 * Measure database query performance
 * 
 * @param {string} queryName - Name of the query for logging
 * @param {Function} queryFn - Query function to execute
 * @returns {Promise} - Query result with performance metrics
 */
export const measureQueryPerformance = async (queryName, queryFn) => {
    try {
        debugLog(`Executing query: ${queryName}`);
        const start = Date.now();
        const result = await queryFn();
        const duration = Date.now() - start;

        if (result.error) {
            debugLog(`Query error (${queryName}):`, result.error, `(${duration}ms)`);
        } else {
            const count = result.data?.length || 0;
            debugLog(`Query successful (${queryName}):`, `${count} records`, `(${duration}ms)`);
        }

        return result;
    } catch (error) {
        debugLog(`Query exception (${queryName}):`, error);
        return { data: null, error };
    }
};