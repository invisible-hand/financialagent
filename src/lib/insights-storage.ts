/**
 * Persistent storage for financial insights using localStorage
 */

// Define the shape of insights data
export interface InsightsData {
  [userType: string]: {
    [insightType: string]: string;
  };
}

// Storage key
const STORAGE_KEY = 'financial-insights-data';

/**
 * Save insights to localStorage
 */
export const saveInsights = (insights: InsightsData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(insights));
  } catch (error) {
    console.error('Failed to save insights to localStorage:', error);
  }
};

/**
 * Load insights from localStorage
 */
export const loadInsights = (): InsightsData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { family: {}, student: {} };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load insights from localStorage:', error);
    return { family: {}, student: {} };
  }
};

/**
 * Clear all insights from localStorage
 */
export const clearInsights = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear insights from localStorage:', error);
  }
};

/**
 * Save a single insight for a specific user type
 */
export const saveInsight = (userType: string, insightType: string, data: string): InsightsData => {
  try {
    const currentInsights = loadInsights();
    
    // Initialize the user type object if it doesn't exist
    if (!currentInsights[userType]) {
      currentInsights[userType] = {};
    }
    
    // Store the insight
    currentInsights[userType][insightType] = data;
    
    // Save back to localStorage
    saveInsights(currentInsights);
    
    return currentInsights;
  } catch (error) {
    console.error('Failed to save individual insight:', error);
    return loadInsights(); // Return the current state
  }
}; 