/**
 * Every selector the suite uses, in one file.
 *
 * cypress-realworld-app annotates its components with `data-test` attributes.
 * Those attributes exist *for* testing, so they survive a designer renaming a
 * class or Material UI reshuffling its internal DOM. That is the whole reason to
 * prefer them over CSS or XPath.
 *
 * ---------------------------------------------------------------------------
 * THE ONE TRAP IN THIS APPLICATION — read before adding a selector
 * ---------------------------------------------------------------------------
 * Most form fields put `data-test` on the Material UI `<TextField>` **root**,
 * which renders as `div.MuiFormControl-root` — not on the `<input>` inside it:
 *
 *     <TextField id="username" data-test="signin-username" ... />
 *       -> <div data-test="signin-username"><div><input id="username" /></div></div>
 *
 * Typing into or clearing that `<div>` fails, so every such selector below ends
 * in ` input`. The application's own suite works around the same thing with
 * `.find("input")`.
 *
 * The exceptions are the fields that pass the attribute through `inputProps`,
 * which lands it on the real `<input>`:
 *
 *     <TextField inputProps={{ "data-test": "user-settings-firstName-input" }} />
 *
 * Those must NOT get the ` input` suffix. There are six of them, and the
 * authoritative list comes from the application source, not from guesswork:
 *
 *     grep -rn 'inputProps=' src/components/*.tsx
 *
 *   - user-list-search-input          (UserListSearchForm)
 *   - user-settings-firstName-input   (UserSettingsForm)
 *   - user-settings-lastName-input    (UserSettingsForm)
 *   - user-settings-email-input       (UserSettingsForm)
 *   - user-settings-phoneNumber-input (UserSettingsForm)
 *   - transaction-comment-input-<id>  (CommentForm)
 *
 * Everything else is a plain `<TextField data-test=...>` and needs the suffix.
 * Checkboxes (`signin-remember-me`) put the attribute on the MUI span wrapper
 * and need it too.
 *
 * Buttons, links and text nodes carry the attribute directly and need no suffix.
 *
 * Every value here was read out of the application source
 * (`grep -rn 'data-test' src/`), not guessed.
 */
export const dt = (name: string) => `[data-test="${name}"]`;

/** A `data-test` on a MUI TextField/Checkbox wrapper: reach the real control. */
export const dtInput = (name: string) => `${dt(name)} input`;

export const SEL = {
  signIn: {
    username: dtInput("signin-username"),
    password: dtInput("signin-password"),
    rememberMe: dtInput("signin-remember-me"),
    submit: dt("signin-submit"),
    error: dt("signin-error"),
  },
  signUp: {
    link: dt("signup"),
    title: dt("signup-title"),
    firstName: dtInput("signup-first-name"),
    lastName: dtInput("signup-last-name"),
    username: dtInput("signup-username"),
    password: dtInput("signup-password"),
    confirmPassword: dtInput("signup-confirmPassword"),
    submit: dt("signup-submit"),
  },
  sideNav: {
    root: dt("sidenav"),
    toggle: dt("sidenav-toggle"),
    username: dt("sidenav-username"),
    fullName: dt("sidenav-user-full-name"),
    balance: dt("sidenav-user-balance"),
    home: dt("sidenav-home"),
    settings: dt("sidenav-user-settings"),
    bankAccounts: dt("sidenav-bankaccounts"),
    notifications: dt("sidenav-notifications"),
    signOut: dt("sidenav-signout"),
  },
  nav: {
    tabs: dt("nav-transaction-tabs"),
    everyone: dt("nav-public-tab"),
    friends: dt("nav-contacts-tab"),
    mine: dt("nav-personal-tab"),
    newTransaction: dt("nav-top-new-transaction"),
    notificationsCount: dt("nav-top-notifications-count"),
  },
  transactions: {
    list: dt("transaction-list"),
    // Item ids are runtime values, so these are builders rather than constants.
    item: (id: string) => dt(`transaction-item-${id}`),
    amount: (id: string) => dt(`transaction-amount-${id}`),
    sender: (id: string) => dt(`transaction-sender-${id}`),
    receiver: (id: string) => dt(`transaction-receiver-${id}`),
    description: dt("transaction-description"),
    detailHeader: dt("transaction-detail-header"),
    emptyHeader: dt("empty-list-header"),
    skeleton: dt("list-skeleton"),
  },
  newTransaction: {
    // Exception: attribute is on the <input> itself via inputProps.
    userSearch: dt("user-list-search-input"),
    usersList: dt("users-list"),
    userItem: (id: string) => dt(`user-list-item-${id}`),
    form: dt("transaction-create-form"),
    amount: dtInput("transaction-create-amount-input"),
    description: dtInput("transaction-create-description-input"),
    submitPayment: dt("transaction-create-submit-payment"),
    submitRequest: dt("transaction-create-submit-request"),
    returnToTransactions: dt("new-transaction-return-to-transactions"),
    createAnother: dt("new-transaction-create-another-transaction"),
  },
  userSettings: {
    // All four go through `inputProps`, so the attribute is already on the
    // <input> — no ` input` suffix here.
    form: dt("user-settings-form"),
    firstName: dt("user-settings-firstName-input"),
    lastName: dt("user-settings-lastName-input"),
    email: dt("user-settings-email-input"),
    phoneNumber: dt("user-settings-phoneNumber-input"),
    submit: dt("user-settings-submit"),
  },
  onboarding: {
    dialog: dt("user-onboarding-dialog"),
    title: dt("user-onboarding-dialog-title"),
    content: dt("user-onboarding-dialog-content"),
    next: dt("user-onboarding-next"),
  },
} as const;
