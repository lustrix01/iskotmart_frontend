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
Result: 26 passed, 3 skipped

| Functionality Tested | Objective | Steps/Procedure | Test Data/Input | Expected Result | Actual Result | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Guest session redirect | Verify protected cart route redirects guests | Open storefront, click Cart | Guest session | Login page appears | Login page appeared | Passed | `test-results/evidence/guest-cart-redirect.png` |
| Protected route redirects | Verify guests cannot open account-only pages | Open `/cart`, `/checkout`, `/profile`, `/profile/orders` | Guest session | Login page appears for each path | Login page appeared for each path | Passed | `test-results/evidence/guest-protected-route-redirects.png` |
| Continue as guest | Verify guest access returns to storefront | Open login, click Continue as guest | Guest session | Storefront appears | Storefront appeared | Passed | Playwright report |
| Invalid login | Verify bad credentials are rejected | Enter invalid credentials, submit | `not-a-real-user@example.com` / wrong password | Error message appears | Error message appeared | Passed | `test-results/evidence/invalid-login-error.png` |
| Login API error handling | Verify non-JSON server output is handled | Mock `/api/login.php` with HTML, submit login | Mock HTML response | User-facing API error appears | User-facing API error appeared | Passed | `test-results/evidence/login-non-json-api-error.png` |
| Search | Verify navbar search opens results | Search for `service` | `service` | `/search?q=service` loads | Search results loaded | Passed | `test-results/evidence/search-results-service.png` |
| Empty search | Verify blank search does not crash | Submit empty navbar search | Empty string | `/search` loads | `/search` loaded | Passed | Playwright report |
| Trimmed search | Verify search trims whitespace | Search for `   audio   ` | `audio` | `/search?q=audio` loads | Trimmed search URL loaded | Passed | Playwright report |
| Product/service browsing | Verify listing pages are public | Open `/products` and `/services` | Guest session | Listing pages load | Listing pages loaded | Passed | Playwright report |
| Unknown route fallback | Verify invalid URLs do not show broken page | Open a missing route | `/this-route-does-not-exist` | Storefront opens | Storefront opened | Passed | Playwright report |
| Storefront API failure | Verify page survives failed listing API | Mock listing API as 500 | Mock JSON error | Storefront remains usable | Storefront remained usable | Passed | `test-results/evidence/storefront-api-failure-survives.png` |
| Customer password validation | Verify weak password is blocked | Fill customer signup with weak password | `weak` | Password policy error appears | Password policy error appeared | Passed | `test-results/evidence/customer-signup-weak-password.png` |
| Password mismatch validation | Verify mismatched passwords are blocked | Fill customer signup with different passwords | `StrongPass!123`, `DifferentPass!123` | Validation dialog appears | Validation dialog appeared | Passed | Playwright report |
| Merchant email validation | Verify merchant signup requires BU email | Complete merchant signup steps with non-BU email | `merchant@example.com` | BU email error appears | BU email error appeared | Passed | `test-results/evidence/merchant-signup-domain-validation.png` |
| Merchant CRUD | Verify merchant item validation and creation | Mock merchant session, add product, submit invalid/valid form | Timestamped product name | Validation appears, item is created | Validation appeared and item was listed | Passed | `test-results/evidence/merchant-product-created.png` |
| Merchant delete confirmation | Verify destructive merchant action asks confirmation | Open delete action on created item | Created mock product | Delete confirmation opens | Delete confirmation opened | Passed | `test-results/evidence/merchant-retire-confirmation.png` |
| Merchant numeric validation | Verify invalid product price/stock are blocked | Enter negative price/stock | `-1`, `-5` | Validation messages appear | Validation messages appeared | Passed | Playwright report |
| Merchant service validation | Verify invalid service slots are blocked | Enter zero service slots | `0` slots | Slot validation appears | Slot validation appeared | Passed | `test-results/evidence/merchant-service-slots-validation.png` |
| Checkout options | Verify COD/GCash checkout options | Mock customer session/cart/payment APIs, open checkout | Mock product cart | COD and GCash options appear | COD and GCash options appeared | Passed | `test-results/evidence/checkout-payment-options.png` |
| Checkout address protection | Verify checkout cannot proceed without address | Mock cart with no saved addresses | Empty address API response | Place Order is disabled | Place Order was disabled | Passed | `test-results/evidence/checkout-address-required.png` |
| Receipt generation | Verify order receipt UI | Mock customer order, open order details | Mock completed order | Print receipt button appears | Print receipt button appeared | Passed | `test-results/evidence/order-receipt-dialog.png` |
| Orders API error handling | Verify orders page handles server error | Mock orders API as 500 | Forced API error | Error message appears | Error message appeared | Passed | `test-results/evidence/orders-api-error.png` |
| Forgot password | Verify reset link flow | Mock forgot-password API success | `customer@example.com` | Reset link appears | Reset link appeared | Passed | `test-results/evidence/forgot-password-reset-link.png` |
| Reset password validation | Verify missing token and weak passwords are blocked | Open reset page without token, then weak password with token | `weak` | Button disabled without token, weak-password error with token | Expected validation appeared | Passed | `test-results/evidence/reset-password-validation.png` |
| Role access control | Verify customer cannot open merchant routes | Mock customer session, open `/merchant/products` | Customer role | Redirect away from merchant route | Redirected to storefront | Passed | `test-results/evidence/customer-blocked-from-merchant.png` |
| Role access control | Verify merchant cannot open customer profile routes | Mock merchant session, open `/profile/orders` | Merchant role | Redirect away from customer route | Redirected to storefront | Passed | `test-results/evidence/merchant-blocked-from-customer-profile.png` |
| Real customer credential smoke test | Verify configured customer account can log in/out | Use `.env` customer credentials | Local `.env` | Customer session reaches profile and logs out | Skipped because configured credentials did not produce expected customer role in this run | Skipped | Playwright report |
| Real merchant credential smoke test | Verify configured merchant account reaches dashboard | Use `.env` merchant credentials | Local `.env` | Merchant dashboard appears | Skipped because configured credentials did not produce expected merchant role in this run | Skipped | Playwright report |
| AI help guest prompt | Verify AI help blocks guest chat API call | Open AI help launcher as guest | Guest session | Login prompt appears and API is not called | Skipped because launcher was not visible in the tested viewport | Skipped | Playwright report |

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

## Reflection / Findings

- Issues encountered: Real account smoke tests still depend on valid local `.env` customer and merchant accounts with the correct roles. Database-sensitive flows were stabilized with mocked authenticated sessions and mocked API responses.
- Warnings/errors detected: Login, storefront, and orders API failure cases showed user-facing errors instead of crashing the UI.
- Bugs discovered: No blocking UI crash was found in the conducted guest, validation, checkout, merchant CRUD, receipt, and role-access tests.
- Improvements made after testing: Added stable mock-session helpers, expanded checkout/order/merchant/password-reset/role-access coverage, and added screenshot evidence for the new scenarios.
- Lessons learned: Automated E2E tests are most reliable when role/session setup and test data are controlled. Real credential tests are useful smoke tests, but repeatable report evidence should not depend on changing local database records.
