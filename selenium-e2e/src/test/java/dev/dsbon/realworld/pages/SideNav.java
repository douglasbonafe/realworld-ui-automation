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
    // Collapsed behind a hamburger on narrow viewports; opening it first keeps
    // one page object valid at every window size.
    if (isPresent(TOGGLE) && visible(TOGGLE).isDisplayed()) {
      click(TOGGLE);
    }
    click(SIGN_OUT);
  }

  public void goToSettings() {
    click(SETTINGS);
  }
}
