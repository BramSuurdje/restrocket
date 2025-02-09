// API version configuration
export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;

// Public routes that don't require authentication
export const PUBLIC_ROUTES = ["/api/health", "/api/auth"];

// Cache configuration
export const DEFAULT_CACHE_MAX_AGE = 60; // seconds
