interface User {
  id: string;
  email: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
}

export async function createMockUser(email: string, walletAddress: string): Promise<User> {
  // Mock user creation
  const user: User = {
    id: Math.random().toString(36).substring(7),
    email,
    walletAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return user;
} 