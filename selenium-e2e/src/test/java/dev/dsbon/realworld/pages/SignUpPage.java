package dev.dsbon.realworld.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** Page object for /signup. */
public class SignUpPage extends BasePage {

  private static final By TITLE = testId("signup-title");
  private static final By FIRST_NAME = testIdInput("signup-first-name");
  private static final By LAST_NAME = testIdInput("signup-last-name");
  private static final By USERNAME = testIdInput("signup-username");
  private static final By PASSWORD = testIdInput("signup-password");
  private static final By CONFIRM_PASSWORD = testIdInput("signup-confirmPassword");
  private static final By SUBMIT = testId("signup-submit");

  public SignUpPage(WebDriver driver) {
    super(driver);
  }

  public SignUpPage open() {
    navigateTo("/signup");
    visible(TITLE);
    return this;
  }

  public SignUpPage register(NewAccount account) {
    fill(FIRST_NAME, account.firstName());
    fill(LAST_NAME, account.lastName());
    fill(USERNAME, account.username());
    fill(PASSWORD, account.password());
    fill(CONFIRM_PASSWORD, account.password());
    click(SUBMIT);
    return this;
  }

  public boolean isSubmitEnabled() {
    return isEnabled(SUBMIT);
  }

  /** The data a registration needs, kept as a record so tests read as data, not setters. */
  public record NewAccount(String firstName, String lastName, String username, String password) {}
}
