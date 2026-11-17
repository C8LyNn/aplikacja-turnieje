// Migrations are numbered 0001, 0002, … without gaps or duplicates. The sequence is
// open-ended: new migrations (0041, 0042, …) are accepted without editing any tool.
export const MIGRATION_FILE = /^(\d{4})_[a-z0-9_]+\.sql$/;

export function assertContiguousMigrationSequence(fileNames) {
  const names = fileNames.filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
  if (names.length === 0) throw new Error("No migrations found.");
  for (const [index, name] of names.entries()) {
    if (!MIGRATION_FILE.test(name)) throw new Error(`Migration file name is not supported: ${name}`);
    const expected = String(index + 1).padStart(4, "0");
    if (name.slice(0, 4) !== expected) {
      throw new Error(`Migrations must be contiguous from 0001: expected ${expected}_*.sql, found ${name}.`);
    }
  }
  return names;
}
