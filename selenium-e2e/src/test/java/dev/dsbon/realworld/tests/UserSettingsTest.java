package dev.dsbon.realworld.tests;

import static org.assertj.core.api.Assertions.assertThat;

import dev.dsbon.realworld.pages.UserSettingsPage;
import dev.dsbon.realworld.pages.UserSettingsPage.Profile;
import dev.dsbon.realworld.support.BaseTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("User settings")
class UserSettingsTest extends BaseTest {

  @BeforeEach
  void signIn() {
    signInAsPrimaryUser();
  }

  @Test
  @DisplayName("persists an updated profile across a reload")
  void persistsProfile() {
    String stamp = String.valueOf(System.currentTimeMillis()).substring(7);
    Profile updated =
        new Profile("New" + stamp, "Name" + stamp, "qa." + stamp + "@example.com", "6155551212");

    UserSettingsPage page =
        new UserSettingsPage(driver).open().fill(updated).save(updated.firstName());

    // Reloading is the point: it proves the change was persisted server-side
    // rather than merely held in component state.
    page.reload();
    assertThat(page.currentValues()).isEqualTo(updated);
  }

  @Test
  @DisplayName("blocks submission when a required field is cleared")
  void blocksInvalidSubmission() {
    // awaitSubmitDisabled, not isSubmitEnabled: the button changes state through
    // a React re-render, and Selenium assertions do not retry. Reading it
    // immediately after the blur passes on a fast laptop and fails on a loaded
    // CI runner — which is what happened here.
    new UserSettingsPage(driver).open().clearFirstName().awaitSubmitDisabled();
  }
}
