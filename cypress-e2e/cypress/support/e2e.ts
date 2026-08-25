import "./commands";

/**
 * cypress-realworld-app is a React app. React development builds emit a
 * `ResizeObserver loop completed with undelivered notifications` error in some
 * browsers when Material UI re-measures a list during a transition. It is
 * benign, it is not raised by our code, and Cypress fails a test on any
 * uncaught exception — so this one exception is filtered out.
 *
 * Note how narrow the filter is. A blanket `return false` here would silence
 * every real application crash and turn the suite into decoration.
 */
Cypress.on("uncaught:exception", (err) => {
  if (err.message.includes("ResizeObserver loop")) {
    return false;
  }
  return true;
});
