package dev.dsbon.realworld.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** The left navigation drawer, present on every authenticated screen. */
public class SideNav extends BasePage {

  private static final By ROOT = testId("sidenav");
  private static final By USERNAME = testId("sidenav-username");
  private static final By FULL_NAME = testId("sidenav-user-full-name");
  private static final By BALANCE = testId("sidenav-user-balance");
  private static final By SIGN_OUT = testId("sidenav-signout");
  private static final By SETTINGS = testId("sidenav-user-settings");
  private static final By TOGGLE = testId("sidenav-toggle");

  public SideNav(WebDriver driver) {
    super(driver);
  }

  public SideNav awaitVisible() {
    visible(ROOT);
    return this;
  }

  /** Rendered as "@username". */
  public String username() {
    return textOf(USERNAME);
  }

  /** Rendered with an abbreviated surname, e.g. "Ted P". */
  public String fullName() {
    return textOf(FULL_NAME);
  }

  /** Rendered as a localized USD string, e.g. "$1,509.53". */
  public String balance() {
    return textOf(BALANCE);
  }

  public void signOut() {
    // Check the TARGET, not the hamburger.
    //
    // The first version asked "is the toggle displayed?" and clicked it if so.
    // On a desktop viewport the toggle IS displayed and the drawer is already
    // open, so that click CLOSED the drawer and made sign-out unreachable — a
    // self-inflicted timeout that only showed up in CI.
    //
    // Asking whether sign-out itself is reachable is correct at every size.
    if (driver.findElements(SIGN_OUT).stream().noneMatch(e -> e.isDisplayed())) {
      click(TOGGLE);
    }
    click(SIGN_OUT);
  }

  public void goToSettings() {
    click(SETTINGS);
  }
}
