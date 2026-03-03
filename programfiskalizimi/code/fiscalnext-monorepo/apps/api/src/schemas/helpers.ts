// Schema Helpers - Reusable validation utilities
import { z } from 'zod';

/**
 * Convert string "true"/"false" from query params to boolean
 * Useful for query string parameters that should be booleans
 */
export const booleanFromString = () => z.preprocess(
  (val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  },
  z.boolean().optional()
);

/**
 * Convert string number from query params to number
 * Useful for pagination and limit parameters
 */
export const numberFromString = () => z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }
    return val;
  },
  z.number().optional()
);
