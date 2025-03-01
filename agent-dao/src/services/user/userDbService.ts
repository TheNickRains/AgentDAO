import { db } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for user data
 */
export interface UserData {
  id?: string;
  email?: string;
  walletAddress?: string;
  smartWalletAddress?: string;
  delegationEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Update user in database
 * @param userId User ID
 * @param userData User data to update
 * @returns Updated user data
 */
export const updateUserInDb = async (userId: string, userData: Partial<UserData>): Promise<UserData> => {
  try {
    // Add updated timestamp
    const dataToUpdate = {
      ...userData,
      updatedAt: new Date()
    };
    
    // Update user in database
    const updatedUser = await db.collection('users').updateOne(
      { id: userId },
      { $set: dataToUpdate }
    );
    
    if (updatedUser.modifiedCount === 0) {
      throw new Error('User not found or no changes made');
    }
    
    // Get updated user
    const user = await db.collection('users').findOne({ id: userId });
    
    return user as UserData;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Create user in database
 * @param userData User data
 * @returns Created user data
 */
export const createUserInDb = async (userData: Partial<UserData>): Promise<UserData> => {
  try {
    // Generate ID if not provided
    const id = userData.id || uuidv4();
    
    // Create user object
    const user: UserData = {
      id,
      email: userData.email || null,
      walletAddress: userData.walletAddress || null,
      smartWalletAddress: userData.smartWalletAddress || null,
      delegationEnabled: userData.delegationEnabled || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert user into database
    await db.collection('users').insertOne(user);
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Get user by ID
 * @param userId User ID
 * @returns User data or null if not found
 */
export const getUserById = async (userId: string): Promise<UserData | null> => {
  try {
    const user = await db.collection('users').findOne({ id: userId });
    return user as UserData;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}; 