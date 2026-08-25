package dev.dsbon.realworld.support;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Reads {@code shared/seed-users.json} — the same fixture the Cypress and
 * Playwright suites consume, so all three frameworks drive identical accounts.
 *
 * <p>The file lives outside this Maven module, which is deliberate: duplicating
 * the fixture per framework is how three suites quietly drift apart until two of
 * them are testing an account that no longer exists.
 */
public final class SeedUsers {

  private static final Path FIXTURE = locateFixture();
  private static final SeedFile SEED = load();

  private SeedUsers() {}

  public static String defaultPassword() {
    return SEED.defaultPassword();
  }

  /** The user every test signs in as unless it says otherwise. */
  public static SeedUser primary() {
    return byRole("primary");
  }

  /** A second, distinct account — the counterparty in payment tests. */
  public static SeedUser contact() {
    return byRole("contact");
  }

  private static SeedUser byRole(String role) {
    return SEED.users().stream()
        .filter(u -> role.equals(u.role()))
        .findFirst()
        .orElseThrow(
            () ->
                new IllegalStateException(
                    "No seed user with role \"%s\" in %s. The app may have been re-seeded with "
                            .formatted(role, FIXTURE)
                        + "\"yarn db:seed\" (random data) instead of \"yarn db:seed:dev\"."));
  }

  /**
   * Walk up from the working directory until {@code shared/seed-users.json} turns
   * up. Surefire runs with the module directory as CWD, but IDEs frequently use
   * the repository root instead — searching upward makes both work without a
   * configuration flag.
   */
  private static Path locateFixture() {
    Path dir = Path.of("").toAbsolutePath();
    for (int i = 0; i < 5 && dir != null; i++, dir = dir.getParent()) {
      Path candidate = dir.resolve("shared").resolve("seed-users.json");
      if (Files.isRegularFile(candidate)) {
        return candidate;
      }
    }
    throw new IllegalStateException(
        "Could not find shared/seed-users.json above " + Path.of("").toAbsolutePath());
  }

  private static SeedFile load() {
    try {
      return new ObjectMapper().readValue(Files.readString(FIXTURE), SeedFile.class);
    } catch (IOException e) {
      throw new UncheckedIOException("Failed to read " + FIXTURE, e);
    }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record SeedFile(String defaultPassword, List<SeedUser> users) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record SeedUser(String id, String username, String firstName, String lastName, String role) {}
}
