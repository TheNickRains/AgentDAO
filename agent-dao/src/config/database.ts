import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-dao';

// MongoDB client
let client: MongoClient;
let db: Db;

/**
 * Connect to MongoDB
 */
export const connectToDatabase = async (): Promise<void> => {
  try {
    // Create MongoDB client
    client = new MongoClient(MONGODB_URI);
    
    // Connect to MongoDB
    await client.connect();
    
    // Get database
    db = client.db();
    
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

/**
 * Close MongoDB connection
 */
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    if (client) {
      await client.close();
      console.log('Closed MongoDB connection');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

// Export database instance
export { db }; 