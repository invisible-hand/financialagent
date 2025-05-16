/**
 * Server-side persistence for financial insights using JSON file storage
 * This simple database allows insights to be shared across all users and sessions
 */

import fs from 'fs';
import path from 'path';

// Define the shape of insights data
export interface InsightsData {
  [userType: string]: {
    [insightType: string]: string;
  };
}

// Path to the JSON database file
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'insights-db.json');

// Empty data structure to use when initializing or on errors
const EMPTY_DATA: InsightsData = { family: {}, student: {} };

// Ensure data directory exists
const ensureDataDir = (): void => {
  try {
    const dirPath = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
    // Continue execution - for read operations we'll return empty data
    // For write operations we'll handle errors downstream
  }
};

/**
 * Load insights from the file database
 */
export const loadInsightsFromDB = async (): Promise<InsightsData> => {
  try {
    ensureDataDir();
    
    // If the file doesn't exist yet, return empty data structure
    if (!fs.existsSync(DB_FILE_PATH)) {
      return { ...EMPTY_DATA };
    }
    
    // Read and parse the JSON file
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load insights from database:', error);
    return { ...EMPTY_DATA };
  }
};

/**
 * Save insights to the file database
 */
export const saveInsightsToDB = async (insights: InsightsData): Promise<void> => {
  try {
    ensureDataDir();
    
    // Write the JSON data to file
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(insights, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save insights to database:', error);
    // In production, we might want to use a more robust storage solution
    // like a real database or cloud storage that works better with serverless
  }
};

/**
 * Save a single insight for a specific user type
 */
export const saveInsightToDB = async (userType: string, insightType: string, data: string): Promise<InsightsData> => {
  try {
    // Load current data
    const currentInsights = await loadInsightsFromDB();
    
    // Initialize the user type object if it doesn't exist
    if (!currentInsights[userType]) {
      currentInsights[userType] = {};
    }
    
    // Store the insight
    currentInsights[userType][insightType] = data;
    
    // Save back to file
    await saveInsightsToDB(currentInsights);
    
    return currentInsights;
  } catch (error) {
    console.error('Failed to save individual insight to database:', error);
    return await loadInsightsFromDB(); // Return the current state
  }
};

/**
 * Check if insights exist for a specific user type
 */
export const hasInsightsForUserType = async (userType: string): Promise<boolean> => {
  try {
    const insights = await loadInsightsFromDB();
    return Boolean(insights[userType] && Object.keys(insights[userType]).length > 0);
  } catch (error) {
    console.error('Failed to check insights for user type:', error);
    return false;
  }
};

/**
 * Get insights for a specific user type
 */
export const getInsightsForUserType = async (userType: string): Promise<Record<string, string> | null> => {
  try {
    const insights = await loadInsightsFromDB();
    return insights[userType] || null;
  } catch (error) {
    console.error('Failed to get insights for user type:', error);
    return null;
  }
}; 