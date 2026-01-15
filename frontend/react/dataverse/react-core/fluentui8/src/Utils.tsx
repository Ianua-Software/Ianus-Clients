/**
 * Cleanses environment identifiers to a consistent format:
 * - Removes curly braces
 * - Converts to lowercase
 * - Trims whitespace
 */
export const normalizeGuid = (identifier: string): string => {
    if (!identifier) return '';
    return identifier
        .replace(/[{}]/g, '') // Remove all { and }
        .toLowerCase()
        .trim();
};
