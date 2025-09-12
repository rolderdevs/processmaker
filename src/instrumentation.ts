import { initializeDatabase } from "./lib/init-db";

export async function register() {
  console.log("🚀 Starting application instrumentation...");

  // Проверяем что мы запускаемся в Node.js runtime
  // if (process.env.NEXT_RUNTIME === "edge") {
  //   console.log("⏭️ Skipping database initialization in Edge runtime");
  //   return;
  // }

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
