/**
 * Content normalization utilities
 * Handles various response formats from AI APIs
 */

/**
 * Normalizes content from various formats (string, object, array) to string
 * @param {*} data - Content data to normalize
 * @returns {string} Normalized content string
 */
export function normalizeContent(data) {
  if (data === null || data === undefined) return "";
  if (typeof data === "string") return data;

  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (item === null || item === undefined) return "";
        if (typeof item === "string") return item;
        if (typeof item === "object") return normalizeContent(item);
        return String(item);
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof data === "object") {
    // Try various common response structures
    if (data.message?.content !== undefined)
      return normalizeContent(data.message.content);
    if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
      return normalizeContent(data.choices[0].message.content);
    }
    if (data.delta?.content !== undefined)
      return normalizeContent(data.delta.content);
    if (data.delta?.text !== undefined)
      return normalizeContent(data.delta.text);
    if (data.content !== undefined) return normalizeContent(data.content);
    if (data.text !== undefined) return normalizeContent(data.text);

    // Fallback: stringify the object
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  return String(data);
}

/**
 * Converts content to string for display
 * Similar to normalizeContent but simpler, used in Message component
 * @param {*} val - Value to convert
 * @returns {string} String representation
 */
export function toStringContent(val) {
  if (typeof val === "string") return val;
  if (val === undefined || val === null) return "";
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}
