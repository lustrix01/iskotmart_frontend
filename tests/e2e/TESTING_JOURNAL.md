# IskoMart Automated Testing Journal

Branch under test: `lighthal`

## Group Information

- Project title: IskoMart
- Test framework: Playwright
- Application scope: Customer and merchant flows only

## Member Contribution Table

| Member | Assigned Feature | Type of Test | Tool/Framework Used |
| --- | --- | --- | --- |
| TBD | Login/session handling | E2E automated UI test | Playwright |
| TBD | Registration validation | E2E automated UI test | Playwright |
| TBD | Search/filtering | E2E automated UI test | Playwright |
| TBD | Merchant CRUD | E2E automated UI test | Playwright |
| TBD | Checkout/orders/receipt | E2E automated UI test | Playwright |

## Test Scenario Documentation

Latest run: `npm run test:e2e -- --project=chromium`  
Result: 29 passed, 0 skipped

| Functionality Tested | Objective | Steps/Procedure | Test Data/Input | Expected Result | Actual Result | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Guest cart redirect | Verify protected cart route redirects guests | Open storefront, click Cart | Guest session | Login page appears | Login page appeared | Passed | `test-results/evidence/01-guest-cart-redirect.png` |
| Protected route redirects | Verify guests cannot open account-only pages | Open `/cart`, `/checkout`, `/profile`, `/profile/orders` | Guest session | Login page appears for each path | Login page appeared for each path | Passed | `test-results/evidence/02-guest-protected-route-redirects.png` |
| Continue as guest | Verify guest access returns to storefront | Open login, click Continue as guest | Guest session | Storefront appears | Storefront appeared | Passed | `test-results/evidence/03-continue-as-guest.png` |
| Invalid login error | Verify bad credentials are rejected | Enter invalid credentials, submit | `not-a-real-user@example.com` / wrong password | Error message appears | Error message appeared | Passed | `test-results/evidence/04-invalid-login-error.png` |
| Login non-JSON API error | Verify non-JSON server output is handled | Mock `/api/login.php` with HTML, submit login | Mock HTML response | User-facing API error appears | User-facing API error appeared | Passed | `test-results/evidence/05-login-non-json-api-error.png` |
| Search results for service | Verify navbar search opens results | Search for `service` | `service` | `/search?q=service` loads | Search results loaded | Passed | `test-results/evidence/06-search-results-service.png` |
| Empty search | Verify blank search does not crash | Submit empty navbar search | Empty string | `/search` loads | `/search` loaded | Passed | `test-results/evidence/07-empty-search.png` |
| Trimmed search query | Verify search trims whitespace | Search for `   audio   ` | `audio` | `/search?q=audio` loads | Trimmed search URL loaded | Passed | `test-results/evidence/08-trimmed-search-audio.png` |
| Product and service listing pages | Verify listing pages are public | Open `/products` and `/services` | Guest session | Listing pages load | Listing pages loaded | Passed | `test-results/evidence/09-product-service-listing-pages.png` |
| Unknown route fallback | Verify invalid URLs do not show broken page | Open a missing route | `/this-route-does-not-exist` | Storefront opens | Storefront opened | Passed | `test-results/evidence/10-unknown-route-fallback.png` |
| Storefront API failure handling | Verify page survives failed listing API | Mock listing API as 500 | Mock JSON error | Storefront remains usable | Storefront remained usable | Passed | `test-results/evidence/11-storefront-api-failure-survives.png` |
| AI Help guest login requirement | Verify AI Help appears on storefront but blocks guest use | Open storefront, click AI launcher | Guest session | Login-required prompt appears and chat API is not called | Login-required prompt appeared and chat API was not called | Passed | `test-results/evidence/12-ai-help-guest-login-required.png` |
| Customer signup weak password | Verify weak password is blocked | Fill customer signup with weak password | `weak` | Password policy error appears | Password policy error appeared | Passed | `test-results/evidence/13-customer-signup-weak-password.png` |
| Customer signup password mismatch | Verify mismatched passwords are blocked | Fill customer signup with different passwords | `StrongPass!123`, `DifferentPass!123` | Validation dialog appears | Validation dialog appeared | Passed | `test-results/evidence/14-customer-signup-password-mismatch.png` |
| Merchant signup domain validation | Verify merchant signup requires BU email | Complete merchant signup steps with non-BU email | `merchant@example.com` | BU email error appears | BU email error appeared | Passed | `test-results/evidence/15-merchant-signup-domain-validation.png` |
| Merchant product creation | Verify merchant item validation and creation | Mock merchant session, add product, submit invalid/valid form | Timestamped product name | Validation appears, item is created | Validation appeared and item was listed | Passed | `test-results/evidence/16-merchant-product-created.png` |
| Merchant delete confirmation | Verify destructive merchant action asks confirmation | Open delete action on created item | Created mock product | Delete confirmation opens | Delete confirmation opened | Passed | `test-results/evidence/17-merchant-retire-confirmation.png` |
| Merchant product negative values | Verify invalid product price/stock are blocked | Enter negative price/stock | `-1`, `-5` | Validation messages appear | Validation messages appeared | Passed | `test-results/evidence/18-merchant-product-negative-values.png` |
| Merchant service slot validation | Verify invalid service slots are blocked | Enter zero service slots | `0` slots | Slot validation appears | Slot validation appeared | Passed | `test-results/evidence/19-merchant-service-slots-validation.png` |
| Checkout payment options | Verify COD/GCash checkout options | Mock customer session/cart/payment APIs, open checkout | Mock product cart | COD and GCash options appear | COD and GCash options appeared | Passed | `test-results/evidence/20-checkout-payment-options.png` |
| Checkout address required | Verify checkout cannot proceed without address | Mock cart with no saved addresses | Empty address API response | Place Order is disabled | Place Order was disabled | Passed | `test-results/evidence/21-checkout-address-required.png` |
| Order receipt dialog | Verify order receipt UI | Mock customer order, open order details | Mock completed order | Print receipt button appears | Print receipt button appeared | Passed | `test-results/evidence/22-order-receipt-dialog.png` |
| Orders API error handling | Verify orders page handles server error | Mock orders API as 500 | Forced API error | Error message appears | Error message appeared | Passed | `test-results/evidence/23-orders-api-error.png` |
| Forgot password reset link | Verify reset link flow | Mock forgot-password API success | `customer@example.com` | Reset link appears | Reset link appeared | Passed | `test-results/evidence/24-forgot-password-reset-link.png` |
| Reset password validation | Verify missing token and weak passwords are blocked | Open reset page without token, then weak password with token | `weak` | Button disabled without token, weak-password error with token | Expected validation appeared | Passed | `test-results/evidence/25-reset-password-validation.png` |
| Customer blocked from merchant pages | Verify customer cannot open merchant routes | Mock customer session, open `/merchant/products` | Customer role | Redirect away from merchant route | Redirected to storefront | Passed | `test-results/evidence/26-customer-blocked-from-merchant.png` |
| Merchant blocked from customer profile | Verify merchant cannot open customer profile routes | Mock merchant session, open `/profile/orders` | Merchant role | Redirect away from customer route | Redirected to storefront | Passed | `test-results/evidence/27-merchant-blocked-from-customer-profile.png` |
| Customer logout clears session | Verify configured customer account can log in/out | Use `.env` customer credentials | Local `.env` | Customer session reaches profile and logs out | Customer reached profile and logged out | Passed | `test-results/evidence/28-customer-logout-clears-session.png` |
| Merchant login dashboard | Verify configured merchant account reaches dashboard | Use `.env` merchant credentials | Local `.env` | Merchant dashboard appears | Merchant dashboard appeared | Passed | `test-results/evidence/29-merchant-login-dashboard.png` |

## Running The Tests

1. Start MySQL/XAMPP and import `db/iskomartdb.sql`.
2. Set test account variables in PowerShell or in local `.env`:

```powershell
$env:E2E_CUSTOMER_EMAIL="customer@example.com"
$env:E2E_CUSTOMER_PASSWORD="E2eTest!23456"
$env:E2E_MERCHANT_EMAIL="merchant@bicol-u.edu.ph"
$env:E2E_MERCHANT_PASSWORD="E2eTest!23456"
```

3. Run:

```powershell
npm run test:e2e
```

The test runner starts `npm run dev:local` automatically when `http://localhost:5173` is not already running. To reuse an already-running app server, set `E2E_REUSE_SERVER=1`.

4. Open the report:

```powershell
npm run test:e2e:report
```

## Important Commands

| Purpose | Command |
| --- | --- |
| Install dependencies after cloning | `npm install` |
| Run the full automated test suite | `npm run test:e2e` |
| Run tests with browser windows visible | `npm run test:e2e:headed` |
| Open the Playwright HTML report | `npm run test:e2e:report` |
| Run only the Chromium project | `npm run test:e2e -- --project=chromium` |
| Run one test file | `npm run test:e2e -- tests/e2e/merchant-crud.spec.js --project=chromium` |
| Run one test by title | `npm run test:e2e -- --project=chromium -g "merchant validates and creates an item"` |
| View generated evidence screenshots | `test-results/evidence/` |
| View generated auth state files | `tests/.auth/` |
| View the HTML report file directly | `playwright-report/index.html` |

Note: `test-results/`, `playwright-report/`, and `tests/.auth/` are generated locally and ignored by Git. Run `npm run test:e2e` again to regenerate them.

## Reflection / Findings

- Issues encountered: Real account smoke tests depend on valid local `.env` customer and merchant accounts with the correct roles. Database-sensitive flows were stabilized with mocked authenticated sessions and mocked API responses.
- Warnings/errors detected: Login, storefront, and orders API failure cases showed user-facing errors instead of crashing the UI.
- Bugs discovered: No blocking UI crash was found in the conducted guest, validation, checkout, merchant CRUD, receipt, and role-access tests.
- Improvements made after testing: Added stable mock-session helpers, expanded checkout/order/merchant/password-reset/role-access coverage, corrected the storefront-only AI Help selector, and added screenshot evidence for the new scenarios.
- Lessons learned: Automated E2E tests are most reliable when role/session setup and test data are controlled. Real credential tests are useful smoke tests, but repeatable report evidence should not depend on changing local database records.
