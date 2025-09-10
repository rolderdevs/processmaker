import { diff_match_patch } from "diff-match-patch";

const DiffType = {
  Unchanged: 0,
  Deleted: -1,
  Inserted: 1,
};

function diffWordMode(text1, text2) {
  const dmp = new diff_match_patch();

  // Split texts into words while preserving whitespace
  const words1 = text1.match(/\S+|\s+/g) || [];
  const words2 = text2.match(/\S+|\s+/g) || [];

  // Create unique character mapping for words
  const wordMap = new Map();
  let charCode = 1;

  // Map all unique words to characters
  [...words1, ...words2].forEach((word) => {
    if (!wordMap.has(word)) {
      wordMap.set(word, String.fromCharCode(charCode++));
    }
  });

  // Convert word arrays to character strings
  const chars1 = words1.map((word) => wordMap.get(word)).join("");
  const chars2 = words2.map((word) => wordMap.get(word)).join("");

  // Perform diff on characters
  const diffs = dmp.diff_main(chars1, chars2, false);

  // Convert back to words
  const wordArray = Array.from(wordMap.entries());
  const charToWord = new Map(wordArray.map(([word, char]) => [char, word]));

  return diffs.map(([type, chars]) => {
    const words = chars
      .split("")
      .map((char) => charToWord.get(char) || char)
      .join("");
    return [type, words];
  });
}

function diffLineMode(text1, text2) {
  const dmp = new diff_match_patch();
  const a = dmp.diff_linesToChars_(text1, text2);
  const lineText1 = a.chars1;
  const lineText2 = a.chars2;
  const lineArray = a.lineArray;
  const diffs = dmp.diff_main(lineText1, lineText2, false);
  dmp.diff_charsToLines_(diffs, lineArray);
  dmp.diff_cleanupSemantic(diffs);
  return diffs;
}

function diffCharMode(text1, text2) {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diffs);
  return diffs;
}

function createMarkdownWithDiff(oldText, newText, mode = "word") {
  let diffs;
  switch (mode) {
    case "word":
      diffs = diffWordMode(oldText, newText);
      break;
    case "line":
      diffs = diffLineMode(oldText, newText);
      break;
    case "char":
      diffs = diffCharMode(oldText, newText);
      break;
    default:
      throw new Error("Unknown diff mode");
  }

  let result = "";
  let lastWasDirective = false;

  for (const [operation, text] of diffs) {
    switch (operation) {
      case DiffType.Inserted:
        if (text.trim()) {
          // Add space before directive if last element was also a directive
          if (lastWasDirective) {
            result += " ";
          }

          // Handle newlines: preserve them outside directives
          if (text.includes("\n")) {
            const parts = text.split("\n");
            for (let i = 0; i < parts.length; i++) {
              if (parts[i].trim()) {
                result += `:add[${parts[i].trim()}]`;
              }
              if (i < parts.length - 1) {
                result += "\n";
              }
            }
          } else {
            result += `:add[${text.trim()}]`;
          }
          lastWasDirective = true;
        } else {
          result += text; // preserve whitespace/newlines
          lastWasDirective = false;
        }
        break;
      case DiffType.Deleted:
        if (text.trim()) {
          // Add space before directive if last element was also a directive
          if (lastWasDirective) {
            result += " ";
          }

          // Handle newlines: preserve them outside directives
          if (text.includes("\n")) {
            const parts = text.split("\n");
            for (let i = 0; i < parts.length; i++) {
              if (parts[i].trim()) {
                result += `:del[${parts[i].trim()}]`;
              }
              if (i < parts.length - 1) {
                result += "\n";
              }
            }
          } else {
            result += `:del[${text.trim()}]`;
          }
          lastWasDirective = true;
        } else {
          result += text; // preserve whitespace/newlines
          lastWasDirective = false;
        }
        break;
      case DiffType.Unchanged:
        result += text;
        lastWasDirective = false;
        break;
    }
  }
  return result;
}

// Real-world markdown content
const originalMarkdown = `# Руководство по API

## Введение

Это **полное руководство** по использованию нашего REST API. API позволяет:

- Управлять пользователями
- Создавать и редактировать документы
- Получать статистику

## Аутентификация

Для доступа к API используйте Bearer токен:

\`\`\`http
GET /api/users
Authorization: Bearer your-token-here
\`\`\`

> **Важно**: Токен действителен 24 часа.

## Эндпоинты

### Пользователи

#### GET /api/users

Получить список всех пользователей.

**Параметры:**
- \`limit\` (integer) - количество записей (по умолчанию 10)
- \`offset\` (integer) - смещение для пагинации

**Пример ответа:**
\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "Иван Петров",
      "email": "ivan@example.com"
    }
  ],
  "total": 1
}
\`\`\`

### Документы

Работа с документами требует специальных прав доступа.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/docs | Список документов |
| POST | /api/docs | Создать документ |
| PUT | /api/docs/{id} | Обновить документ |

## Коды ошибок

- \`400\` - Неверный запрос
- \`401\` - Не авторизован
- \`404\` - Не найдено
- \`500\` - Внутренняя ошибка

---

*Обновлено: 2024-01-15*`;

const modifiedMarkdown = `# Руководство по GraphQL API

## Введение

Это **обновленное руководство** по использованию нашего GraphQL API. API позволяет:

- Управлять пользователями и ролями
- Создавать и редактировать документы
- Получать детальную статистику
- Работать с файлами

## Аутентификация

Для доступа к API используйте JWT токен в заголовке:

\`\`\`http
POST /graphql
Authorization: Bearer your-jwt-token
Content-Type: application/json
\`\`\`

> **Важно**: Токен действителен 7 дней.

## Запросы

### Пользователи

#### Получить пользователей

\`\`\`graphql
query GetUsers($limit: Int, $offset: Int) {
  users(limit: $limit, offset: $offset) {
    id
    name
    email
    role
    createdAt
  }
  usersCount
}
\`\`\`

**Переменные:**
- \`limit\` (Int) - количество записей (по умолчанию 20)
- \`offset\` (Int) - смещение для пагинации

**Пример ответа:**
\`\`\`json
{
  "data": {
    "users": [
      {
        "id": "1",
        "name": "Иван Петров",
        "email": "ivan@example.com",
        "role": "USER",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "usersCount": 1
  }
}
\`\`\`

### Документы и Файлы

Работа с документами и файлами требует роли EDITOR или выше.

| Операция | Тип | Описание |
|----------|-----|----------|
| getDocuments | Query | Список документов |
| createDocument | Mutation | Создать документ |
| updateDocument | Mutation | Обновить документ |
| uploadFile | Mutation | Загрузить файл |

## Коды ошибок

- \`BAD_USER_INPUT\` - Неверные данные
- \`UNAUTHENTICATED\` - Не авторизован
- \`FORBIDDEN\` - Недостаточно прав
- \`NOT_FOUND\` - Не найдено
- \`INTERNAL_ERROR\` - Внутренняя ошибка

## Подписки

GraphQL поддерживает real-time подписки:

\`\`\`graphql
subscription DocumentUpdated {
  documentUpdated {
    id
    title
    updatedAt
  }
}
\`\`\`

---

*Обновлено: 2024-02-01*`;

console.log("=".repeat(80));
console.log("COMPREHENSIVE MARKDOWN DIFF TEST");
console.log("=".repeat(80));

console.log("\n📄 ORIGINAL CONTENT:");
console.log("-".repeat(40));
console.log(originalMarkdown);

console.log("\n📝 MODIFIED CONTENT:");
console.log("-".repeat(40));
console.log(modifiedMarkdown);

console.log("\n" + "=".repeat(80));
console.log("DIFF ANALYSIS");
console.log("=".repeat(80));

const modes = ["char", "word", "line"];

modes.forEach((mode) => {
  console.log(`\n🔍 ${mode.toUpperCase()} MODE DIFF:`);
  console.log("-".repeat(60));

  const result = createMarkdownWithDiff(
    originalMarkdown,
    modifiedMarkdown,
    mode,
  );

  // Show first 200 chars to see the pattern
  const preview = result.substring(0, 500) + (result.length > 500 ? "..." : "");
  console.log("PREVIEW:", preview);

  // Analyze problems
  const issues = [];

  // Count directives
  const addCount = (result.match(/:add\[/g) || []).length;
  const delCount = (result.match(/:del\[/g) || []).length;

  // Check for problems
  if (result.includes(":add[]") || result.includes(":del[]")) {
    issues.push("Empty directives found");
  }

  if (
    result.includes("\\n") &&
    (result.includes(":add[") || result.includes(":del["))
  ) {
    issues.push("Escaped newlines in directives");
  }

  // Check for unclosed directives
  const unclosedAdd =
    (result.match(/:add\[/g) || []).length -
    (result.match(/\]:add|\] :add|:add\[.*?\]/g) || []).length;
  const unclosedDel =
    (result.match(/:del\[/g) || []).length -
    (result.match(/\]:del|\] :del|:del\[.*?\]/g) || []).length;

  if (result.includes(":add[") && !result.includes("]")) {
    issues.push("Potentially unclosed add directives");
  }

  if (result.includes(":del[") && !result.includes("]")) {
    issues.push("Potentially unclosed del directives");
  }

  // Check if markdown structure is preserved
  const hasHeaders = result.includes("# ") || result.includes("## ");
  const hasLists = result.includes("- ") || result.includes("1. ");
  const hasCode = result.includes("```") || result.includes("`");

  console.log(`📊 STATS: ${addCount} additions, ${delCount} deletions`);
  console.log(
    `📝 MD ELEMENTS: headers=${hasHeaders}, lists=${hasLists}, code=${hasCode}`,
  );

  if (issues.length > 0) {
    console.log("⚠️  ISSUES:", issues.join(", "));
  } else {
    console.log("✅ NO MAJOR ISSUES DETECTED");
  }
});

console.log("\n" + "=".repeat(80));
console.log("RAW DIFF DATA (for debugging)");
console.log("=".repeat(80));

modes.forEach((mode) => {
  console.log(`\n${mode.toUpperCase()} MODE RAW DIFFS:`);

  let diffs;
  switch (mode) {
    case "word":
      diffs = diffWordMode(originalMarkdown, modifiedMarkdown);
      break;
    case "line":
      diffs = diffLineMode(originalMarkdown, modifiedMarkdown);
      break;
    case "char":
      diffs = diffCharMode(originalMarkdown, modifiedMarkdown);
      break;
  }

  console.log("First 10 diff operations:");
  diffs.slice(0, 10).forEach(([type, text], index) => {
    const typeStr = type === -1 ? "DEL" : type === 1 ? "ADD" : "SAME";
    const preview = JSON.stringify(
      text.substring(0, 50) + (text.length > 50 ? "..." : ""),
    );
    console.log(`  ${index + 1}. [${typeStr}] ${preview}`);
  });

  if (diffs.length > 10) {
    console.log(`  ... and ${diffs.length - 10} more operations`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("RECOMMENDATIONS");
console.log("=".repeat(80));
console.log("• CHAR mode: Most granular, but may break markdown syntax");
console.log("• WORD mode: Good balance, preserves most markdown structure");
console.log("• LINE mode: Preserves markdown blocks, but less precise");
console.log(
  "• Look for patterns in the raw diff data to understand the algorithm",
);
console.log(
  "• Test with your specific content changes to find the best approach",
);
