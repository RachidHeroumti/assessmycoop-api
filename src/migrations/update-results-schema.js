import { sequelize } from "../config/db.js";
import { QueryTypes } from "sequelize";

/**
 * Migration script to update the results table schema
 * Changes:
 * - Rename 'questions' column to 'answers'
 * - Add new columns: overallScore, scoresByCategory, interpretation, recommendations
 */

const migrateResultsTable = async () => {
  try {
    console.log("🔄 Starting migration for results table...");

    // Check if the table exists
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'results'",
      { type: QueryTypes.SELECT }
    );

    if (!tables) {
      console.log("❌ Results table does not exist. Please run the app first to create tables.");
      return;
    }

    // Check current columns
    const columns = await sequelize.query(
      "SHOW COLUMNS FROM results",
      { type: QueryTypes.SELECT }
    );

    const columnNames = columns.map(col => col.Field);
    console.log("📋 Current columns:", columnNames);

    // Step 1: Rename 'questions' to 'answers' if it exists
    if (columnNames.includes('questions') && !columnNames.includes('answers')) {
      console.log("🔄 Renaming 'questions' column to 'answers'...");
      await sequelize.query(
        "ALTER TABLE results CHANGE COLUMN questions answers JSON"
      );
      console.log("✅ Column renamed successfully");
    } else if (columnNames.includes('answers')) {
      console.log("✅ 'answers' column already exists");
    } else {
      console.log("➕ Adding 'answers' column...");
      await sequelize.query(
        "ALTER TABLE results ADD COLUMN answers JSON NOT NULL DEFAULT ('[]')"
      );
      console.log("✅ 'answers' column added");
    }

    // Step 2: Add overallScore column if it doesn't exist
    if (!columnNames.includes('overallScore')) {
      console.log("➕ Adding 'overallScore' column...");
      await sequelize.query(
        "ALTER TABLE results ADD COLUMN overallScore FLOAT NULL"
      );
      console.log("✅ 'overallScore' column added");
    } else {
      console.log("✅ 'overallScore' column already exists");
    }

    // Step 3: Add scoresByCategory column if it doesn't exist
    if (!columnNames.includes('scoresByCategory')) {
      console.log("➕ Adding 'scoresByCategory' column...");
      await sequelize.query(
        "ALTER TABLE results ADD COLUMN scoresByCategory JSON NULL"
      );
      console.log("✅ 'scoresByCategory' column added");
    } else {
      console.log("✅ 'scoresByCategory' column already exists");
    }

    // Step 4: Add interpretation column if it doesn't exist
    if (!columnNames.includes('interpretation')) {
      console.log("➕ Adding 'interpretation' column...");
      await sequelize.query(
        "ALTER TABLE results ADD COLUMN interpretation VARCHAR(255) NULL"
      );
      console.log("✅ 'interpretation' column added");
    } else {
      console.log("✅ 'interpretation' column already exists");
    }

    // Step 5: Add recommendations column if it doesn't exist
    if (!columnNames.includes('recommendations')) {
      console.log("➕ Adding 'recommendations' column...");
      await sequelize.query(
        "ALTER TABLE results ADD COLUMN recommendations JSON NULL"
      );
      console.log("✅ 'recommendations' column added");
    } else {
      console.log("✅ 'recommendations' column already exists");
    }

    // Show final schema
    const finalColumns = await sequelize.query(
      "SHOW COLUMNS FROM results",
      { type: QueryTypes.SELECT }
    );
    
    console.log("\n✅ Migration completed successfully!");
    console.log("📋 Final schema:");
    console.table(finalColumns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Default: col.Default
    })));

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    await migrateResultsTable();
    
    await sequelize.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

runMigration();

