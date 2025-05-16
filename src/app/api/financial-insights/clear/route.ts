import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Path to the JSON database file
    const DB_FILE_PATH = path.join(process.cwd(), 'data', 'insights-db.json');
    
    // Create an empty database structure
    const emptyData = { family: {}, student: {} };
    
    // Ensure data directory exists
    try {
      const dirPath = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating data directory:', error);
      return NextResponse.json({ error: 'Failed to ensure data directory exists' }, { status: 500 });
    }
    
    // Write the empty data structure to the file
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(emptyData, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json({ error: 'Failed to clear database' }, { status: 500 });
  }
} 