import { getDB } from "./db";

export async function initializeDatabase(): Promise<void> {
  console.log("🔧 Starting database initialization...");

  try {
    const db = await getDB();
    console.log("🔌 Database connection established");

    // Define the prompt table schema
    console.log("📋 Creating prompt table...");
    await db.query(`
      DEFINE TABLE IF NOT EXISTS prompt TYPE NORMAL SCHEMAFULL
        PERMISSIONS NONE
      ;
    `);

    // Define fields
    await db.query(`
      DEFINE FIELD IF NOT EXISTS title ON prompt TYPE string
        PERMISSIONS FULL
      ;
    `);

    await db.query(`
      DEFINE FIELD IF NOT EXISTS content ON prompt TYPE string
        PERMISSIONS FULL
      ;
    `);

    await db.query(`
      DEFINE FIELD IF NOT EXISTS time ON prompt TYPE object DEFAULT { }
        PERMISSIONS FULL
      ;
    `);

    await db.query(`
      DEFINE FIELD IF NOT EXISTS time.created ON prompt TYPE datetime READONLY VALUE time::now()
        PERMISSIONS FULL
      ;
    `);

    await db.query(`
      DEFINE FIELD IF NOT EXISTS time.updated ON prompt TYPE datetime VALUE time::now()
        PERMISSIONS FULL
      ;
    `);

    await db.query(`
      DEFINE FIELD IF NOT EXISTS isDefault ON prompt TYPE bool DEFAULT false
        PERMISSIONS FULL
      ;
    `);

    // Check if there are any prompts
    console.log("🔍 Checking for existing prompts...");
    const existingPrompts = await db.select("prompt");
    console.log("📊 Found prompts:", existingPrompts?.length || 0);

    // Create default prompt if none exist
    if (!existingPrompts || existingPrompts.length === 0) {
      console.log("➕ Creating default prompt...");
      await db.create("prompt", {
        title: "Default Assistant",
        content:
          "You are a helpful AI assistant. Please provide clear, accurate, and helpful responses to user questions.",
        isDefault: true,
      });

      console.log("✅ Default prompt created");
    } else {
      console.log("⏭️ Default prompt already exists, skipping");
    }

    console.log("🎉 Database initialized successfully");
  } catch (error) {
    console.error("💥 Failed to initialize database:", error);
    throw error;
  }
}
