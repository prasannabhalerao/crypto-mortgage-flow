
import { migrateMockDataToSupabase } from "./propertyService";
import { migrateMockLoansToSupabase } from "./loanService";

/**
 * Migrate all mock data to Supabase if tables are empty
 * This is useful for development and demonstration purposes
 */
export const migrateAllMockData = async () => {
  try {
    console.log("Starting migration of mock data to Supabase...");
    
    // Migrate properties first (loans depend on properties)
    await migrateMockDataToSupabase();
    
    // Then migrate loans
    await migrateMockLoansToSupabase();
    
    console.log("Mock data migration complete!");
  } catch (error) {
    console.error("Error during migration process:", error);
  }
};
