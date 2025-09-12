// Connection
export { getDB, getDB as default } from "./connection";
export type { BaseRecord, TimeFields } from "./repositories/base";

// Base repository utilities
export {
  BaseRepository,
  recordIdToString,
  recordsToString,
} from "./repositories/base";

// Repositories
export {
  type Prompt,
  PromptsRepository,
  promptsRepository,
} from "./repositories/prompts";

// Schema initialization
export {
  initializeDatabase,
  initializeSchema,
  seedDefaultData,
} from "./schema";
