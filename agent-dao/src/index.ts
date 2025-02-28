import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { setupRoutes } from './api/routes';
import { initializeServices } from './services/init';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
initializeServices();

// Setup routes
setupRoutes(app);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app; 