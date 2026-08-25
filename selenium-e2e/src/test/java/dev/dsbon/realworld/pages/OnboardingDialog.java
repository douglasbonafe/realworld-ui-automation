package dev.dsbon.realworld.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * The modal first-run wizard shown to a user with no bank account. It blocks
 * every other interaction until completed, so any test that registers a fresh
 * account has to expect it.
 */
public class OnboardingDialog extends BasePage {

  private static final By DIALOG = testId("user-onboarding-dialog");
  private static final By TITLE = testId("user-onboarding-dialog-title");
  private static final By NEXT = testId("user-onboarding-next");

  public OnboardingDialog(WebDriver driver) {
    super(driver);
  }

  public String awaitTitle() {
    visible(DIALOG);
    return textOf(TITLE);
  }

  public boolean isPresent() {
    return isPresent(DIALOG);
  }

  public void next() {
    click(NEXT);
  }
}
