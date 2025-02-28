import { initializeSupabase } from './database/supabaseService';
import { initializePostmark } from './email/postmarkService';
import { initializeOpenAI } from './ai/openaiService';
import { initializeBiconomy } from './blockchain/biconomyService';
import { initializeCCIP } from './blockchain/ccipService';

export const initializeServices = (): void => {
  console.log('Initializing services...');
  
  try {
    // Initialize Supabase
    initializeSupabase();
    console.log('✅ Supabase initialized');
    
    // Initialize Postmark
    initializePostmark();
    console.log('✅ Postmark initialized');
    
    // Initialize OpenAI
    initializeOpenAI();
    console.log('✅ OpenAI initialized');
    
    // Initialize Biconomy
    initializeBiconomy();
    console.log('✅ Biconomy initialized');
    
    // Initialize CCIP
    initializeCCIP();
    console.log('✅ CCIP initialized');
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    throw new Error('Failed to initialize services');
  }
}; 