import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { setupRoutes } from './api/routes';
import { connectToDatabase, closeDatabaseConnection } from './config/database';
import { errorHandler } from './middleware/errorMiddleware';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Initialize services
async function initializeServices() {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Setup routes
    setupRoutes(app);
    
    // Error handler middleware (must be after routes)
    app.use(errorHandler);
    
    // Routes for HTML pages
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../onboarding.html'));
    });
    
    app.get('/onboarding', (req, res) => {
      res.sendFile(path.join(__dirname, '../onboarding.html'));
    });
    
    app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, '../dashboard.html'));
    });
    
    // Fallback for undefined routes
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error initializing services:', error);
    process.exit(1);
  }
}

// Initialize services
initializeServices();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  closeDatabaseConnection().then(() => process.exit(1));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  closeDatabaseConnection().then(() => process.exit(1));
});

export default app; 