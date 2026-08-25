export interface SeedUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: "primary" | "contact" | "spare";
}

/** The user every test logs in as unless it says otherwise. */
export const primaryUser = (): SeedUser => userByRole("primary");

/** A second, distinct account — the counterparty in payment tests. */
export const contactUser = (): SeedUser => userByRole("contact");

export const defaultPassword = (): string => Cypress.env("defaultPassword") as string;

function userByRole(role: SeedUser["role"]): SeedUser {
  const users = Cypress.env("seedUsers") as SeedUser[];
  const match = users.find((u) => u.role === role);
  if (!match) {
    throw new Error(
      `No seed user with role "${role}". Check shared/seed-users.json — the app may have ` +
        `been re-seeded with "yarn db:seed" instead of "yarn db:seed:dev".`,
    );
  }
  return match;
}
