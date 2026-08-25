import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export interface SeedUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: "primary" | "contact" | "spare";
}

interface SeedFile {
  defaultPassword: string;
  users: SeedUser[];
}

/**
 * The same `shared/seed-users.json` the Cypress and Selenium suites read, so all
 * three frameworks drive the same accounts and a change to the app's seed data
 * is a one-file fix.
 */
const seed: SeedFile = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../shared/seed-users.json", import.meta.url)), "utf8"),
);

export const DEFAULT_PASSWORD = seed.defaultPassword;

export function userByRole(role: SeedUser["role"]): SeedUser {
  const match = seed.users.find((u) => u.role === role);
  if (!match) {
    throw new Error(
      `No seed user with role "${role}" in shared/seed-users.json. The app may have been ` +
        `re-seeded with "yarn db:seed" (random data) instead of "yarn db:seed:dev".`,
    );
  }
  return match;
}

export const PRIMARY_USER = userByRole("primary");
export const CONTACT_USER = userByRole("contact");

/** Storage state written by the setup project and reused by every test. */
export const STORAGE_STATE = fileURLToPath(new URL("../.auth/primary-user.json", import.meta.url));
