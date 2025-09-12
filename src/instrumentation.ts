import { initializeDatabase } from "./lib/db";

export async function register() {
  console.log("🚀 Starting application instrumentation...");

  try {
    // Инициализируем базу данных при запуске приложения
    // SurrealDB имеет встроенную логику переподключения
    await initializeDatabase();
    console.log("✅ Database initialization completed");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    // Не останавливаем приложение, SurrealDB автоматически переподключится
  }
}
