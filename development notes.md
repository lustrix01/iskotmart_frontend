# Development Notes

These notes preserve completed phase tracking, implementation history, verification findings, and historical context split out from `development plan.md` to keep the active plan lightweight.

Open this file only when past implementation detail is needed for the current task.

## Completed And Historical Work

The sections below preserve the project history, implementation notes, and previous phase tracking. Use the active priorities above for current work planning.

## Phase 1: Local Setup And Project Guardrails

- [x] Keep `AGENTS.md`, `checklist.md`, and `development plan.md` local-only through `.gitignore`.
- [x] Keep `npm run dev:local` as the documented local startup path.
- [x] Confirm XAMPP MySQL/MariaDB database import steps still match `README.md`.
- [x] Confirm PHP API requests return JSON through the Vite proxy and do not fall through to Vite HTML.
- [x] Keep future implementation changes small, scoped, and verified.

## Phase 2: Authentication, Guest Mode, And Route Behavior

- [x] Start unauthenticated visitors on the Store page instead of a blocked customer route.
- [x] Add a clear continue-as-guest path from the login page.
- [x] Treat guest mode as browse-only.
- [x] Change profile access for guests to a sign-in prompt or redirect.
- [x] Redirect guest add-to-cart and booking actions to login.
- [x] Disable logout for guests and show sign-in instead.
- [x] Verify customer, merchant, moderator, and admin route guards use server-backed auth state.
- [x] Keep login, signup, logout, `/api/me.php`, and auth context behavior consistent.

## Phase 3: Customer Profile And Address Database Integration

- [x] Load the Profile page from the logged-in database account.
- [x] Load customer addresses from the logged-in database account.
- [x] Add or connect API endpoints for address list, create, update, delete, and default selection.
- [x] Fix the address edit duplicate bug so editing updates the current address.
- [x] Validate address ownership on the server for every address mutation.
- [x] Handle empty, loading, validation-error, and API-error states in the UI.

## Phase 4: Storefront, Search, Cart, And Checkout Behavior

- [x] Implement search bar behavior across storefront listings.
- [x] Decide which storefront data remains mock-only and which must come from MySQL.
- [x] Prevent guests from mutating cart or booking state.
- [x] Keep cart totals, item quantities, shipping/service fees, discounts, and checkout totals derived from trusted data.
- [x] Limit checkout payment methods to GCash and COD for the current project scope.
- [x] Validate checkout requests server-side, including stock, service availability, merchant ownership, and final totals.
- [x] Verify customer Store, product details, cart, checkout, orders, and service booking paths manually for the current mock storefront scope.

Phase 4 confirmation note: storefront products/services and cart contents remain mock-only in this phase because actual product/service creation and image-backed catalog persistence are scheduled for Phase 5. Checkout validation includes a MySQL-backed path for real product/service IDs, but current mock storefront actions do not create product, cart, or order records in the database.

## Phase 5: Merchant Product/Service Management And Image Handling

- [~] Add image attachment when creating products.
- [~] Add image attachment when creating services, if services are managed in the same surface.
- [~] Add image attach and remove support when editing products.
- [~] Add image attach and remove support when editing services.
- [~] Store image metadata in the database and files in a controlled upload directory.
- [~] Validate upload MIME type, extension, size, count, ownership, and storage path on the server.
- [~] Show useful upload previews, remove controls, validation messages, and fallback images in React.

Phase 5 testing note: image attach/remove UI and upload API are implemented, but Phase 5 is not confirmed. Full verification is blocked because the merchant product/service surface still falls back to hardcoded/mock records and is not yet fully database-backed in normal use.

## Phase 6: Discounts, Vouchers, Payments, Receipts, And Subscription Removal

- [T] Add more merchant-facing information for discounts and vouchers.
- [T] Validate voucher code, active dates, usage limits, ownership, and minimum spend server-side.
- [T] Move voucher code application from cart to checkout.
- [T] Record voucher usage during successful checkout so one-use voucher limits are enforced.
- [T] Validate product discount type, amount, dates, and eligible product ownership server-side.
- [T] Keep GCash and COD selectable in checkout without implementing real payment processing.
- [T] Add receipt printing for customer orders.
- [~] Keep receipt content tied to database order data, not client-local totals.
- [T] Remove merchant subscription routes, navigation, and UI surfaces.
- [T] Remove admin subscription fee controls if they no longer apply to the product scope.

Phase 6 testing note: merchant discount/voucher validation API is implemented and the merchant UI falls back locally when database-backed merchant products are not available. Customer checkout now validates voucher codes against merchant-owned vouchers, applies voucher discounts at checkout, and records successful voucher usage in `VOUCHER_USAGE`. A one-use voucher was verified by placing one successful DB-backed checkout and confirming the second checkout attempt returns `Voucher usage limit has been reached.` Receipt printing uses the displayed order record; full database-backed receipt verification remains blocked until customer orders are loaded from MySQL.

## Phase 7: UI Cleanup: Dark Mode, Notifications, Header Text, Navigation Consistency

- [T] Remove dark mode functionality from preferences and any related state.
- [T] Remove notification preference surfaces and notification-only mock UI where requested.
- [T] Fix IskoMart header text and make it bold consistently with the login page.
- [T] Keep navigation labels and protected-action behavior consistent for guest, customer, merchant, moderator, and admin users.
- [T] Check mobile and desktop layouts for text overlap, broken spacing, and inconsistent header behavior.
- [T] Preserve useful transactional status messages for form submissions and API errors.

Phase 7 implementation note: dark mode and notification preference controls were removed from customer preferences, mock header notification badges were removed from role dashboards, and navbar responsiveness/role navigation behavior were updated. Remaining unconfirmed work is manual cross-device QA across all major pages (not only touched layouts) and a full role-path regression pass for protected actions.

## Phase 8: Security Hardening And Validation

- [T] Enforce merchant signup email domain server-side.
- [T] Enforce strong passwords server-side and mirror the requirement in React validation.
- [T] Confirm every SQL query that includes user input uses prepared statements.
- [T] Confirm all protected API endpoints derive user ID and role from session state.
- [T] Confirm role and ownership checks are server-side for customer, merchant, moderator, and admin actions.
- [T] Disable public PHP warnings and stack traces in user-facing responses.
- [T] Normalize API JSON errors without leaking SQL, filesystem, or stack details.
- [T] Add CSRF/session hardening if cookie-based mutation endpoints are expanded.
- [T] Review upload handling before enabling image management in production-like flows.

Phase 8 implementation note: server-side strong password validation is now enforced in signup and mirrored in customer/merchant signup React forms. Merchant domain restriction remains enforced server-side. API responses were normalized to avoid exposing schema/table internals in user-facing error messages, and merchant offering status input is now allowlisted. Mutation endpoints now enforce same-origin request checks (`Origin`/`Referer` + `Sec-Fetch-Site`) as CSRF hardening, and upload handling review added stricter source validation (`is_uploaded_file`) for offering image uploads.

## Phase 9: Regression Testing And User Confirmation

- [T] Run `npm run build`.
- [T] Run `npm run lint`.
- [T] Run `C:\xampp\php\php.exe -l` for each changed PHP API file.
- [ ] Verify API endpoints return JSON for success, validation errors, auth errors, and server errors.
- [T] Verify guest route behavior, including Store, Profile, Cart, Checkout, add-to-cart, and sign-in redirects.
- [T] Verify signup and login for customer and merchant accounts.
- [T] Verify profile and address data load from the database for the logged-in account.
- [T] Verify address create, edit, delete, and default flows do not duplicate records.
- [ ] Verify product/service image add, edit, remove, and validation flows.
- [ ] Verify checkout with GCash and COD, receipt printing, and order display.
- [ ] Complete manual browser checks for desktop and mobile layouts.
- [ ] Mark completed items `[T]` after implementation and verification.
- [ ] Move `[T]` items to `[x]` only after user confirmation.

Phase 9 findings note:
- Automated checks passed: `npm run build`, `npm run lint`, and PHP syntax lint (`php -l`) across API/backend PHP files.
- API JSON behavior was verified for auth errors (`401`), validation errors (`422`), and method errors (`405`) in CLI checks, and signup success JSON (`201`) was also confirmed.
- Guest route guard behavior was verified in browser: guest access to protected actions/routes redirects to `/login` (Cart, Profile, Checkout, add-to-cart).
- Customer and merchant signup/login flows were verified in browser, including merchant domain-gated signup (`@bicol-u.edu.ph`) and role-based landing pages.
- Profile and address DB-backed flows were verified in browser for a logged-in customer: address create, edit (no duplicate record created), delete, and default handling.
- Merchant product image flow was partially re-verified in browser for product add/edit/remove, but complete service parity and full validation matrix coverage are still pending.
- Checkout/receipt/order is partially verified: checkout page exposes GCash/COD paths and order detail + print receipt controls render, but full end-to-end checkout completion is still blocked by merchant/payment compatibility in current dataset and mixed mock-vs-DB order sources.
- Checkout voucher regression was verified with a DB-backed product checkout: voucher apply succeeds once, inserts `VOUCHER_USAGE`, and a second checkout attempt with the same one-use voucher is rejected with a `422` usage-limit error.
- Full manual desktop/mobile layout sweep is still pending.

## Placeholder Removal And Standardization Policy

- [T] Remove user-facing placeholder content from active customer flows (wishlist and product/service reviews now show neutral empty states instead of fabricated records).
- [T] Replace unclear generic placeholders (for example `...`) with context-specific guidance text.
- [T] Re-add in-scope landing page merchandising sections (`Featured Products`, `Featured Services`, `On Sale`) backed by real storefront/API records only.
- [T] Keep `Daily Discovery` removed because it is outside the current scope.
- [ ] Continue migrating hardcoded storefront/order samples to database-backed records or explicit empty/loading states.
- [ ] Keep action/status copy user-facing only; avoid pseudo-internal/debug wording in UI text.
- [ ] For new pages/components, block merge when static sample records are used without an explicit temporary-dev flag and cleanup task.

Policy progress note:
- Customer wishlist, product/service review blocks, messages, and orders now default to explicit empty states instead of seeded mock records.
- Customer product category sidebar labels were standardized to concrete categories and placeholder subcategory labels were removed.
- Customer landing placeholder sections were removed to avoid fabricated catalog content. `Featured Products`, `Featured Services`, and `On Sale` are now reintroduced through database-backed storefront offerings; `Daily Discovery` remains removed as out of scope.
- Added API-backed customer data surfaces for orders and messages (`/api/customer_orders.php`, `/api/customer_messages.php`) and connected customer pages to fetch these endpoints with loading/error fallbacks.
- Checkout now persists database-backed product orders into `ORDERS` and `ORDER_ITEM`, including stock decrement and API response order reference (`ORD-<id>`); mock-catalog fallback checkout remains non-persistent by design.
- Checkout now also persists database-backed service checkouts into `SERVICE_REQUEST` with slot decrement and service request reference (`SRV-<id>`). Customer orders API now merges product orders and service requests into a unified order history feed.
- Added customer order action endpoint (`/api/customer_order_actions.php`) and connected customer Orders cancel/confirm actions to server-side updates for both `ORD-*` and `SRV-*` records with ownership and status transition checks.
- Upgraded `/api/merchant_orders.php` to a unified merchant orders API: it now returns both product orders and service requests in one feed, and supports status updates for both `source: "order"` and `source: "service_request"` using existing merchant order controls.

## Merchant Real Data, Payment Confirmation, Analytics, And Earnings Follow-Up

- [T] Replace Shop Settings public stats preview placeholders with API-backed metrics.
  - Rating: average `REVIEW.RATING` for all offerings owned by the merchant, plus review count.
  - Sold: sum completed product quantities from `ORDER_ITEM` joined through merchant-owned `PRODUCT`, plus completed service request quantities parsed from `SERVICE_REQUEST.CUSTOMER_INFO` where available.
  - Response: derive an initial response metric from `MESSAGE` rows, such as merchant reply rate/conversations replied to and average first response time. If the schema cannot support the exact desired metric, show a neutral unavailable state instead of a fake percentage.
  - Joined: use `USERS.CREATED_ON` for the merchant account.
  - Suggested endpoint shape: extend `api/merchant_profile.php` or add `api/merchant_shop_metrics.php`, then consume it in `src/pages/merchant/ShopSettings.jsx`.
- [T] Fix merchant dashboard Recent Activity so it returns existing merchant orders.
  - Current blocker: `api/merchant_dashboard.php::recentMerchantActivity()` correctly queries and merges `$rows`, but returns `array_map(..., $stmt->fetchAll(...))` even though `$stmt` is undefined in that scope.
  - Return the mapped `$rows` array instead.
  - Filter dashboard activity to all non-complete/non-cancelled orders and service requests: product `ORDERS.ORDER_STATUS NOT IN ('COMPLETED', 'DELIVERED', 'CANCELLED')`; service `SERVICE_REQUEST.REQ_STATUS NOT IN ('COMPLETED', 'DELIVERED', 'CANCELLED')`.
  - Update the empty state copy from "No database orders for this merchant yet." to a user-facing non-complete-order state, for example "No active orders right now."
- [T] Define payment status rules before allowing completion.
  - COD: checkout creates order/request as `UNPAID`. Merchant can move Pending -> Confirmed -> Shipped/Ready, but cannot complete until payment is collected. Add a merchant action "Mark COD as paid" that updates payment status to `PAID`, records a `PAYMENT` row if an `ALLOWED_PAYMENT_ID` can be resolved, then enables completion.
  - GCash: checkout should not auto-trust a typed reference as paid. Store the GCash reference and amount in `PAYMENT` with a pending/for-review state, or add a payment status value such as `PENDING_PAYMENT_REVIEW` until the merchant/admin confirms it. If the current `PAYMENT` schema has no status column, use `ORDERS.PAYMENT_STATUS` / `SERVICE_REQUEST.CUSTOMER_INFO.paymentStatus` as the source of truth and consider a migration adding `PAYMENT.STATUS`.
  - Completion guard: block both merchant `Completed` updates in `api/merchant_orders.php` and customer `confirm` actions in `api/customer_order_actions.php` unless payment status is `PAID`.
  - UI guard: hide/disable "Complete Delivery" and customer confirm controls for unpaid orders and show the required payment confirmation action.
- [T] Persist payment records consistently.
  - On GCash checkout, capture `referenceNumber`, amount, related `ORDER_ID` or `REQUEST_ID`, and resolved `ALLOWED_PM_ID` in `PAYMENT`.
  - On COD payment collection, create a payment record using a generated or explicit cash receipt reference, amount, related order/request ID, and COD `ALLOWED_PM_ID`.
  - Normalize service payment status; avoid storing only inside JSON if future queries need analytics/earnings. Prefer a schema migration to add `PAYMENT_STATUS` to `SERVICE_REQUEST`, or consistently join through `PAYMENT`.
- [T] Replace Analytics placeholders with real database aggregates.
  - Add `api/merchant_analytics.php` or extend `api/merchant_summary.php`.
  - Metrics: total paid/completed sales, active order count, unique customers, sales trend by day/week/month, top performers by quantity/revenue, low performers by low sales/no sales, inventory alerts from `PRODUCT.STOCK_QTY <= 5`.
  - Remove hardcoded chart paths/data and render charts from API buckets, with empty states when there is no data.
- [T] Replace Earnings placeholders with real database aggregates.
  - Gross revenue: sum paid/completed product `ORDERS.TOTAL_AMOUNT` and service `SERVICE_REQUEST.TOTAL_PRICE`.
  - Net earnings: gross minus discounts/vouchers/refunds/platform fees if those concepts are present. If no fee table exists, show net equal to gross with a clear "No platform fees configured" note.
  - Revenue breakdown: group by merchant-owned offering and compute sold quantity, gross, discounts, and percent of merchant revenue.
  - Deductions: use `ORDERS.DISCOUNT_AMT`, `VOUCHER_USAGE.DISCOUNT_AMT`, cancelled/refunded orders if supported, and fee tables only when real schema exists.
- [T] Verification checklist for this batch.
  - Seed or use one product order and one service request for the same merchant.
  - Verify Recent Activity lists all non-complete orders and hides completed/cancelled ones.
  - Verify unpaid COD cannot be completed until "Mark COD as paid" is recorded.
  - Verify GCash creates a reviewable payment record and cannot be completed before confirmation if manual review is required.
  - Verify Shop Settings, Analytics, and Earnings show real values or honest empty states only.
  - Run `npm run lint`, `npm run build`, and PHP syntax checks for changed API files.

Batch verification note (May 17, 2026):
- Seeded verification merchant/customer data, one product COD order, one product GCash order, and one service request.
- Verified `/api/merchant_dashboard.php` Recent Activity returns active non-complete merchant records and hides records after completion.
- Verified merchant COD, GCash, and service completion attempts return `409` until payment is marked paid.
- Verified customer confirm action returns `409` for an unpaid shipped order.
- Verified Shop Settings metrics, Analytics, and Earnings endpoints return real aggregate values and neutral unavailable states where schema data is missing.
- `npm run lint`, `npm run build`, and PHP syntax checks passed for changed API files.

## Implemented Changes Summary

### Placeholder cleanup and standardization
- Replaced placeholder review avatar with branded initials badge in `src/pages/customer/ProductDetails.jsx`.
- Replaced generic `...` cart input placeholder with contextual text in `src/pages/customer/Cart.jsx`.
- Reworded unclear offering ID placeholder in `src/pages/merchant/MerchantDiscounts.jsx`.

### Removed mock/fabricated customer content
- Replaced mock wishlist data with explicit empty state in `src/pages/customer/Wishlist.jsx`.
- Removed fabricated review blocks/filters and added neutral no-reviews state in `src/pages/customer/ProductDetails.jsx`.
- Removed seeded orders UI data and kept explicit empty/loading/error states in `src/pages/customer/Orders.jsx`.
- Replaced fabricated messaging simulation with API-ready empty-state UI in `src/pages/customer/Messages.jsx`.
- Replaced placeholder product categories/subcategories with concrete labels in `src/pages/customer/ShopProducts.jsx`.

### Added customer API surfaces
- Added customer orders endpoint `api/customer_orders.php` (later unified with service requests).
- Added customer messages endpoint `api/customer_messages.php`.
- Wired customer pages to fetch APIs:
  - `src/pages/customer/Orders.jsx`
  - `src/pages/customer/Messages.jsx`

### Checkout persistence (backend)
- Upgraded `api/checkout.php` to persist DB-backed product checkout:
  - inserts into `ORDERS` and `ORDER_ITEM`
  - decrements `PRODUCT.STOCK_QTY`
  - returns persistent `ORD-<id>` reference.
- Added DB-backed service checkout persistence in `api/checkout.php`:
  - inserts into `SERVICE_REQUEST`
  - decrements `SERVICE.SLOTS`
  - returns `SRV-<id>` reference (or grouped form).

### Checkout address and voucher fixes (May 15, 2026)
- Removed placeholder checkout address data and now loads the logged-in customer's saved address through `/api/addresses.php`.
- Blocks product checkout until the customer has a saved shipping address and links them to profile address management.
- Moved voucher entry/application from cart to checkout and added customer voucher validation endpoint `api/customer_voucher.php`.
- Checkout now sends the applied voucher code to `api/checkout.php`, recalculates the discount server-side, and rejects client discounts without a voucher code.
- Voucher usage is revalidated inside the checkout transaction with row locking and recorded in `VOUCHER_USAGE` after successful product order or service request creation.
- Verified one-use voucher behavior: first checkout succeeds, second checkout with the same voucher returns `Voucher usage limit has been reached.`

### Unified customer order history
- Extended `api/customer_orders.php` to merge product orders (`ORD-*`) and service requests (`SRV-*`) into one sorted feed for Orders page.

### Customer order actions (server-backed)
- Added `api/customer_order_actions.php`:
  - supports `cancel`/`confirm` for `ORD-*` and `SRV-*`
  - enforces customer ownership and status-transition validation.
- Updated `src/pages/customer/Orders.jsx` to call this endpoint and refresh from server.

### Merchant order/service handling
- Rebuilt `api/merchant_orders.php`:
  - `GET` returns unified merchant feed (product orders + service requests)
  - `POST/PATCH` supports status updates for both via `source`, `rawId`, `status`
  - includes merchant ownership checks for both record types.
- This aligns with existing `src/pages/merchant/MerchantOrders.jsx` update flow.

### Validation runs performed
- `npm run lint` passed after each major batch.
- `php -l` passed for changed PHP files:
  - `api/checkout.php`
  - `api/customer_orders.php`
  - `api/customer_messages.php`
  - `api/customer_order_actions.php`
  - `api/merchant_orders.php`

### Playwright Regression Note (May 15, 2026)
- Full Playwright pass was run for recent order/messages/checkout changes.
- Verified working:
  - Customer signup and authenticated routing to customer pages.
  - Customer `Orders` and `Messages` API-backed loading states (`200` with array payloads).
  - Customer action endpoint behavior and error handling (`404` for unknown references).
  - Merchant signup/session and merchant orders page compatibility with unified `/api/merchant_orders.php`.
  - Role guards (`403`) for cross-role endpoint access (customer endpoints as merchant, merchant endpoints as customer).
- Current blockers for full end-to-end status-flow verification:
  - Product checkout in tested dataset is blocked by merchant allowed-payment validation (`Selected payment method is not allowed by the merchant`), so real `ORD-*` persistence was not exercised in browser flow.
  - Services listing currently has `0` DB-backed records in tested state, so true `SRV-*` persistence path from storefront listing could not be fully exercised through normal UI flow.
- Follow-up needed in a new session:
  - Seed at least one DB-backed product/service offering with compatible allowed payment, then rerun Playwright for full `ORD-*` / `SRV-*` create + customer cancel/confirm + merchant status update end-to-end.

### Catalog, messaging, sessions, discounts, and vouchers update (May 15, 2026)
- Added product/service descriptions to merchant add/edit flows and exposed descriptions on customer product/service detail pages with read-more behavior for long text.
- Added persistent customer wishlist support:
  - new `api/customer_wishlist.php`
  - runtime creation of `CUSTOMER_WISHLIST`
  - updated `db/iskomartdb.sql` with the wishlist table, indexes, and foreign keys
  - customer wishlist page now loads saved products/services from the database.
- Updated storefront payloads to include merchant IDs, merchant names, and offering descriptions.
- Replaced customer merchant profile placeholder data with `api/public_merchant.php`, loading real merchant profile data and active merchant products/services.
- Replaced placeholder customer and merchant messages with database-backed two-way messaging:
  - customer messages can send and display merchant replies correctly
  - merchant messages load real customer conversations and can reply
  - added `api/merchant_messages.php`
  - updated `api/customer_messages.php` sender-role handling.
- Added per-browser-window client session handling:
  - new `src/api/clientSession.js`
  - API requests send `X-Isko-Client-Session`
  - backend stores separate logical auth sessions per client token
  - fixed private-window autologin and multi-private-window account conflicts.
- Expanded merchant discounts:
  - renamed Product Discounts to Discounts
  - discounts can target either merchant products or services
  - discount form uses a dropdown of existing merchant offerings and auto-fills original price
  - start date is blocked before today and end date is blocked before tomorrow in both UI and API validation.
- Tightened voucher behavior:
  - voucher expiry date cannot be in the past
  - duplicate voucher codes for the same merchant are rejected
  - active and used vouchers are separated in the merchant UI
  - used vouchers are marked `INACTIVE`
  - checkout and voucher validation reject already-used vouchers.
- Fixed merchant dashboard API robustness:
  - replaced fragile activity `UNION` query with separate product/service activity queries merged in PHP
  - added safe fallbacks so one dashboard query failure does not return a full `500`.
- Validation performed for this batch:
  - `npm run lint`
  - `npm run build`
  - PHP syntax checks for changed API files, including dashboard, discounts, checkout, voucher, messages, config, logout, public merchant, wishlist, and offerings endpoints.

### Merchant profile, reviews, dashboard analytics, and storefront promotion update (May 17, 2026)
- `api/merchant_dashboard.php`
  - Added real `salesTrend.last7Days` and `salesTrend.last30Days` payloads from paid completed product orders and paid completed service requests.
  - Dashboard graph data is now bucketed by date and includes daily revenue and order counts.
- `src/pages/merchant/MerchantDashboard.jsx`
  - Replaced static placeholder SVG paths with a real generated line/area chart from `salesTrend`.
  - Added period revenue, paid order count, peak day, y-axis labels, x-axis labels, point tooltips, and a no-sales empty state.
- `api/merchant_profile.php`
  - Added persistent merchant banner support with runtime `MERCHANT.SHOP_BANNER_URL` column creation.
  - Stores uploaded banner images in `/api/uploads/merchant-banners` and returns `bannerUrl` in the merchant profile payload.
- `src/pages/merchant/ShopSettings.jsx`
  - Made Update Banner open a real image picker.
  - Added banner preview, file type/size validation, and save payload support via `bannerImage`.
- `api/public_merchant.php`
  - Added public `bannerUrl` exposure for customer-visible merchant profiles.
  - Replaced placeholder customer-facing merchant stats with real rating, review, sold, and active offering counts.
  - Added real per-offering rating/review/sold data for the merchant profile product/service grids.
- `src/pages/customer/MerchantProfile.jsx`
  - Renders the merchant's saved banner on the public profile.
  - Keeps the original styled fallback banner when no merchant banner is available.
- `api/offering_reviews.php`
  - Added review attachment loading from `REVIEW_ATTACH`.
  - Stores one uploaded review image per rating in `/api/uploads/reviews` and returns `attachments` with reviews and `myReview`.
- `src/pages/customer/Orders.jsx`
  - Sends uploaded rating images to `api/offering_reviews.php`.
  - Adds client-side 5MB validation for review images.
- `src/pages/customer/ProductDetails.jsx`
  - Displays review image attachments as clickable thumbnails in the Ratings and reviews section.
- `api/storefront_offerings.php`
  - Added weekly paid-sales metrics for products.
  - Added active discount detection and discounted price/label output.
  - Returns automatic `featuredProducts` and `onSaleProducts`, each capped at 10 and ranked by weekly performance.
- `src/data/storefrontData.js`
  - Exposes `featuredProducts` and `onSaleProducts` from the storefront API through `useStorefrontListings`.
- `src/pages/customer/CustomerHome.jsx`
  - Restored Featured Products and On Sale Now sections using the `main` branch layout style.
  - Uses database-backed weekly product performance instead of placeholder cards.
- `src/pages/customer/ShopProducts.jsx`
  - Supports `/products?sale=true` filtering.
  - Sorts Top sales by weekly quantity and revenue.
- Validation performed for this batch:
  - `npm run build`
  - `php -l api/merchant_dashboard.php`
  - `php -l api/merchant_profile.php`
  - `php -l api/offering_reviews.php`
  - `php -l api/public_merchant.php`
  - `php -l api/storefront_offerings.php`

### Implementation gap audit after scope update (May 18, 2026)

Scope clarification: the system no longer includes admin or moderator panels. Treat `main` as the visual/system reference for active customer and merchant experiences only. Admin/moderator prototype pages from `main` are no longer product requirements.

- [T] Fix production build failure.
  - Updated the build script to use `vite build` instead of `vite build .`, which avoids the Vite/Rolldown invalid emitted `index.html` path failure on this Windows workspace.
  - Verification: `npm run lint` passes.
  - Verification: `npm run build` passes.
- [T] Remove admin/moderator surfaces from the active app.
  - Removed `/admin` and `/moderator` route trees from `src/App.jsx`.
  - Removed active admin/moderator lazy imports from `src/App.jsx`.
  - Removed admin/moderator landing redirects from `src/auth/LoginPage.jsx`; unsupported roles now fall back to the storefront.
  - Removed admin/moderator navbar targets from `src/components/Navbar.jsx`; unsupported signed-in roles now resolve to storefront-safe links.
  - Note: legacy admin/moderator source files still exist in the repository but are no longer imported by the active route tree.
- [T] Finish merchant product/service catalog persistence.
  - `api/merchant_offerings.php` now resolves merchant-selected product/service categories to the correct subcategory foreign keys instead of assigning the first available subcategory.
  - Merchant service create/edit now includes open slots in `src/pages/merchant/MerchantProducts.jsx`, persists slots through `api/merchant_offerings.php`, and returns `slots` in the merchant offering payload.
  - Product and service edits now persist category changes by updating `PRODSUBCAT_ID` / `SERSUBCAT_ID`.
  - Decimal pricing is treated as out of scope for the current schema because `PRODUCT.PRICE` and `SERVICE.PRICE` are integer columns; the UI/API now validate whole-peso prices instead of silently rounding.
- [T] Complete storefront listing controls.
  - Product/service pages now derive merchant carousel data from DB-backed storefront listings and link merchant cards to `/merchant/:id`; "See all" links no longer point to `#`.
  - Product/service category sidebars now link to real filtered listing URLs.
  - Product price and service rate controls now sort low-to-high / high-to-low.
  - Product and service pagination counts and buttons are derived from actual listing counts instead of hardcoded labels.
  - Service sort modes now apply real sorting for highest rated, most booked, newest, and rate.
  - `api/storefront_offerings.php` now exposes service slots and completed-service counts for storefront service cards and sorting.
  - Verification: `php -l api/merchant_offerings.php`, `php -l api/storefront_offerings.php`, `npm run lint`, and `npm run build` pass.
- [T] Replace checkout payment simulation with real merchant/payment data.
  - Added `api/checkout_payment_options.php` so checkout loads customer-visible payment methods from merchant-owned `PAYMENT_METHOD` / `ALLOWED_PAYMENT` rows instead of hardcoded GCash details.
  - Checkout disables GCash/COD when the selected merchant offering has not enabled that method and shows the configured merchant GCash number, username, link, QR URL, and notes when available.
  - GCash checkout now requires a proof image, submits it to `api/checkout.php`, stores it under `/api/uploads/payment-proofs`, and records the saved URL in `PAYMENT.PROOF_URL` with a runtime-safe column migration.
  - Service deadline editing now binds to `serviceData.deadline` instead of a fixed date value.
  - Verification: `php -l api/checkout.php`, `php -l api/checkout_payment_options.php`, `php -l api/payment_helpers.php`, `npm run lint`, and `npm run build` pass.
- [T] Remove mock-catalog checkout fallback if real-data-only checkout is required.
  - Removed `api/checkout.php` hardcoded fallback unit prices and generated non-persistent order references.
  - Checkout now rejects non-DB-backed items with `Item is not available for checkout.` and always returns persistent `ORD-*` / `SRV-*` references for successful supported checkout types.
  - Merchant allowed-payment validation now requires an active `ALLOWED_PAYMENT` / `PAYMENT_METHOD` mapping instead of allowing checkout when no mapping exists.
  - Verification: `php -l api/checkout.php`, `npm run lint`, and `npm run build` pass.
- [T] Scope cart data to the authenticated customer or persist it server-side.
  - `src/context/CartContext.jsx` now stores carts under per-customer localStorage keys (`iskotmart_cart_v1_customer_<id>`) with a separate guest key.
  - Cart state reloads when the active customer key changes, preventing pending cart items from one browser account from appearing under another account.
  - Verification: `npm run lint` and `npm run build` pass.

### Storefront, voucher, navigation badge, and dashboard metric update (May 18, 2026)

Scope clarification: subscription and promo surfaces remain removed because they are outside the current product scope. Daily Discovery is also outside scope and should not be restored.

- [T] Keep homepage merchandising limited to in-scope sections.
  - Removed the Categories block from the homepage merchandising flow so Featured Products, Featured Services, and On Sale Now are the only storefront showcase sections on the landing page.
  - Added Featured Services back to `src/pages/customer/CustomerHome.jsx` using the same API-backed pattern as Featured Products.
  - Added `featuredServices` to `api/storefront_offerings.php` and `src/data/storefrontData.js`, ranked by completed service count, review count, rating, and recency.
  - Kept Daily Discovery removed.
  - Verification: `php -l api/storefront_offerings.php`, `npm run lint`, and `npm run build` pass.
- [T] Add useful navbar counts without restoring wishlist counts.
  - Added `api/nav_counts.php` for unread message counts.
  - Navbar now shows a badge only for unread messages and customer cart count; wishlist remains badge-free.
  - Cart badge displays `99+` when the count exceeds 99.
  - Customer and merchant message GET endpoints now mark incoming unread messages as `READ` when the messages page loads.
  - Verification: `php -l api/nav_counts.php`, `php -l api/customer_messages.php`, `php -l api/merchant_messages.php`, `npm run lint`, and `npm run build` pass.
- [T] Support multiple checkout vouchers with merchant-scoped discount application.
  - Checkout now stores applied vouchers as a list instead of a single voucher and sends `voucherCodes` to `api/checkout.php`.
  - The same voucher code cannot be applied twice in the UI or accepted twice by the checkout API.
  - `api/customer_voucher.php` and `api/checkout.php` validate each voucher against only the subtotal for the voucher owner's merchant.
  - Multiple vouchers can be applied as long as each code is unique and the total discount for that merchant does not exceed that merchant's eligible subtotal.
  - Voucher usage is still recorded in `VOUCHER_USAGE`; vouchers are marked inactive only after their configured `USAGE_LIMIT` is reached.
  - Verification: `php -l api/customer_voucher.php`, `php -l api/checkout.php`, `npm run lint`, and `npm run build` pass.
- [T] Standardize visible currency formatting to peso symbol in touched surfaces.
  - Customer home product/service cards, checkout summary, voucher display, storefront discount labels, and merchant dashboard money labels now use `₱` instead of `PHP`.
  - Verification: `php -l api/storefront_offerings.php`, `php -l api/merchant_dashboard.php`, `npm run lint`, and `npm run build` pass.
- [T] Replace merchant dashboard visitor metric with unique customers.
  - Removed the irrelevant Store Visitors dashboard metric from `src/pages/merchant/MerchantDashboard.jsx`.
  - `api/merchant_dashboard.php` now returns `customers`, counted once per customer across merchant-owned product orders and service requests.
  - Dashboard now displays Customers with the note "Unique customers with orders."
  - Verification: `php -l api/merchant_dashboard.php`, `npm run lint`, and `npm run build` pass.

### Merchant dashboard, profile, messaging, and voucher modal update (May 18, 2026)

- [T] Remove dashboard stat trend text.
  - Removed the green subtext from Total Sales, Active Orders, Products Listed, and Customers in `src/pages/merchant/MerchantDashboard.jsx`.
- [T] Remove follow controls from merchant profile surfaces.
  - Removed the Follow button from the customer-facing merchant profile in `src/pages/customer/MerchantProfile.jsx`.
  - Removed the disabled Follow preview from merchant shop settings in `src/pages/merchant/ShopSettings.jsx`.
- [T] Allow merchant profile changes to reflect on customer and merchant sides.
  - Added merchant avatar/profile image upload to `src/pages/merchant/ShopSettings.jsx`.
  - `api/merchant_profile.php` now stores merchant avatar images under `/api/uploads/merchant-avatars` and updates `USERS.AVATAR_URL`.
  - Customer-facing merchant profiles already read `USERS.AVATAR_URL` through `api/public_merchant.php`, so saved avatar changes now reflect publicly.
  - Added `SHOP_BANNER_URL` to the `merchant` table definition in `db/iskomartdb.sql` to match the runtime banner migration.
- [T] Support image-only message attachments.
  - `src/pages/customer/Messages.jsx` and `src/pages/merchant/MerchantMessages.jsx` now expose an image picker, preview the selected image, and render sent/received message images.
  - Message upload pickers only accept JPG, PNG, WebP, or GIF.
  - `api/customer_messages.php` and `api/merchant_messages.php` now persist image attachments through `MESSAGE.ATTACH_URL` and `MESSAGE.ATTACH_FILETYPE`.
  - Non-image attachment payloads are rejected with a validation error.
- [T] Fix voucher retire modal wording.
  - The retire confirmation modal in `src/pages/merchant/MerchantDiscounts.jsx` now shows `Retire Voucher?` on the voucher tab and `Retire Discount?` on the discounts tab.
- Validation performed for this batch:
  - `php -l api/merchant_profile.php`
  - `php -l api/customer_messages.php`
  - `php -l api/merchant_messages.php`
  - `npm run lint`
  - `npm run build`

### AI help Groq setup and public read-only context (May 18, 2026)

- [T] Configure local Groq-backed AI help safely.
  - `.env.example` documents `GROQ_API_KEY`, `GROQ_MODEL`, and optional `AI_HELP_DEBUG`.
  - `.gitignore` ignores local `.env` files while allowing `.env.example`.
  - `scripts/dev-local.ps1` loads `.env` into the local PHP process and refuses to reuse an existing API server on port `8000` so stale environment variables are not silently used.
  - `api/config.php` loads project `.env` values for missing PHP environment variables, while preserving real process environment variables.
  - `README.md` documents local AI help setup and debug mode.
- [T] Move the AI help provider from OpenRouter to Groq and restrict public context.
  - `api/ai_help_chat.php` uses Groq chat completions with the configured model.
  - The chatbot receives read-only public product and service listings, active listing discounts, listed prices, listing review summaries, merchant summaries, merchant listing counts, and merchant review summaries.
  - The chatbot does not query voucher tables and is instructed not to answer voucher questions with voucher details.
  - The endpoint applies request-size and per-user rate limits and returns optional provider debug details only when `AI_HELP_DEBUG` is enabled.
- [T] Improve chatbot UX around auth and provider errors.
  - `src/components/AiHelpChat.jsx` keeps the launcher visible for guests and shows a login prompt instead of hiding the feature.
  - Chat responses are split into readable lines, and debug details from the API are surfaced when enabled.
- [T] Clarify chatbot scope and limitations.
  - `src/components/AiHelpChat.jsx` now starts with an explicit instruction that the chatbot can compare listings, prices, discounts, reviews, and merchant details only.
  - `api/ai_help_chat.php` now tells the model it is read-only and cannot checkout, book services, edit carts, manage wishlists, apply vouchers, place orders, message merchants, or change account data.
- Validation performed for this batch:
  - Direct Groq request using the local `.env` key returned `groq-ok`.
  - `C:\xampp\php\php.exe -l api\config.php`
  - `C:\xampp\php\php.exe -l api\ai_help_chat.php`
  - Runtime check confirmed `api/config.php` loads `GROQ_API_KEY` from `.env` when absent from the process.
  - Scanned `api/ai_help_chat.php` for voucher table references; no voucher queries are present.

### Live browser and database verification findings (May 18, 2026)

- [T] Verified merchant dashboard and profile flow in browser.
  - Ran the app at `http://localhost:5173` with the PHP API at `http://127.0.0.1:8000`.
  - Logged in as test merchant `pw.merchant.20260515@bicol-u.edu.ph`.
  - Confirmed dashboard cards no longer show green subtext under Total Sales, Active Orders, Products Listed, and Customers.
  - Confirmed merchant shop settings no longer show the Follow preview.
  - Updated merchant shop name, description, address, and avatar through the UI.
  - Confirmed the database saved the merchant profile update, including `USERS.AVATAR_URL`.
- [T] Verified customer-facing merchant profile in browser.
  - Opened `/merchant/9` and confirmed the public profile renders the updated shop name, description, address, and avatar.
  - Confirmed the public merchant profile only shows Message and no Follow button.
- [T] Verified image message flow with browser and database checks.
  - Logged in as test customer `pw.customer.20260515@example.com`.
  - Sent an image-only message from customer to merchant.
  - Logged back in as the merchant and confirmed the image message appeared in merchant messages.
  - Sent an image-only reply from merchant to customer.
  - Confirmed database rows were inserted with empty `MSG_TEXT`, populated `ATTACH_URL`, and `ATTACH_FILETYPE = image/png` for both customer and merchant image messages.
  - Confirmed a `data:text/plain` attachment payload is rejected with HTTP `422` and the message `Messages only allow JPG, PNG, WebP, or GIF images.`
- [T] Verified voucher retire modal and retired voucher actions.
  - Created test voucher `LIVEFLOW25` through the merchant Discount and Voucher page.
  - Opened retire confirmation from the voucher row and confirmed the modal title reads `Retire Voucher?`.
  - Retired the voucher and confirmed the database status changed to `RETIRED`.
  - Confirmed the retired voucher appears in Used / Retired Vouchers with no edit or retire buttons.
- Findings and test data notes:
  - Only console noise observed was expected unauthenticated `/api/me.php` `401` responses before login.
  - Test account passwords for users `8` and `9` were reset to `TestPass123!` for repeatable browser login.
  - Test merchant `9` profile data was updated during verification.
  - Test voucher `LIVEFLOW25` was created and retired during verification.
  - Image message rows were inserted for customer `8` and merchant `9`.

### Auth persistence, scope cleanup, checkout merchant split, and customer avatar update (May 18, 2026)

- [T] Fix remember-me session persistence.
  - `src/api/clientSession.js` now restores remembered client-session tokens from `localStorage` into `sessionStorage` so the PHP remember-me cookie can remain usable after a browser restart.
  - `src/auth/LoginPage.jsx` stores the client-session token only when Remember me is checked and clears remembered tokens for normal login.
  - Customer and merchant signup flows clear remembered client-session tokens so newly created sessions do not inherit an old remembered token.
  - Logout in `src/context/AuthContext.jsx` clears the remembered client-session token before calling `/api/logout.php`.
- [T] Remove admin and moderator source files from the active frontend scope.
  - Deleted `src/layouts/AdminLayout.jsx` and `src/layouts/IskoModLayout.jsx`.
  - Deleted all files under `src/pages/admin` and `src/pages/moderator`.
  - Kept API role normalization strings for compatibility with existing user data.
- [T] Prevent mixed-merchant product checkout from creating ambiguous orders.
  - `api/checkout.php` now rejects product checkout payloads containing products from more than one merchant.
  - `src/pages/customer/Cart.jsx` groups product cart rows by merchant and exposes a `Checkout This Merchant` action per group.
  - The global product checkout action is disabled when multiple merchant groups are present.
  - `src/pages/customer/ProductDetails.jsx` and `src/pages/customer/Wishlist.jsx` now preserve `merchantId` when adding items to the cart.
- [T] Allow customers to upload a profile picture.
  - The disabled profile camera button in `src/pages/customer/Profile.jsx` now opens a JPG/PNG/WebP file picker, validates a 5MB limit, previews the selected avatar, and submits it with profile saves.
  - `api/profile.php` now stores customer profile images under `/api/uploads/customer-avatars` and updates `USERS.AVATAR_URL`.
- Validation performed for this batch:
  - `php -l api/checkout.php`
  - `php -l api/profile.php`
  - `npm run lint`
  - `npm run build`
  - `git diff --check`

### Merchant fulfillment settings reflected in customer checkout (May 18, 2026)

- [T] Persist merchant Payment & Delivery settings and reflect them in customer checkout.
  - `api/merchant_profile.php` now stores merchant fulfillment fields on `MERCHANT`: COD enabled, GCash enabled, meetup enabled, delivery enabled, and delivery fee.
  - `src/pages/merchant/ShopSettings.jsx` now loads those saved fulfillment settings and submits them with profile saves.
  - `api/merchant_profile.php` syncs saved payment settings to existing `ALLOWED_PAYMENT` rows for the merchant's offerings.
  - `api/merchant_offerings.php` now applies the merchant's saved payment and delivery defaults when products/services are created or updated.
  - `api/checkout_payment_options.php` returns saved delivery availability and delivery fee to customer checkout, and only enables payment methods supported by every checkout item.
  - `src/pages/customer/Checkout.jsx` disables customer-side payment/delivery choices that the merchant turned off and displays the merchant's saved delivery fee.
  - `api/checkout.php` enforces merchant payment and delivery settings server-side and uses the saved delivery fee in checkout totals.
  - `db/iskomartdb.sql` includes the fulfillment columns for fresh database imports.
- Validation performed for this batch:
  - `php -l api/merchant_profile.php`
  - `php -l api/merchant_offerings.php`
  - `php -l api/checkout_payment_options.php`
  - `php -l api/checkout.php`
  - `npm run lint`
  - `npm run build`
  - `git diff --check`

### UX confirmations, shop closure, messaging fixes, and merchant insights consolidation (May 18, 2026)

- [T] Replaced remaining native or missing destructive confirmations where needed.
  - `src/pages/customer/Addresses.jsx` now uses an in-app delete-address confirmation modal instead of `window.confirm`.
  - Existing validation-only native alerts were audited separately and left for inline validation follow-up.
- [T] Added password visibility controls across auth and merchant security forms.
  - Updated login, customer signup, merchant signup, reset password, and merchant shop security password fields with eye/eye-off toggles.
- [T] Added soft merchant shop closure.
  - `api/merchant_profile.php` now accepts `DELETE` after the merchant types their email and sets `USERS.STATUS = 'INACTIVE'`.
  - `src/pages/merchant/ShopSettings.jsx` now shows a typed-email confirmation modal, logs the merchant out, and redirects to login after closure.
  - `api/checkout.php` and `api/customer_voucher.php` now block stale checkout and voucher validation for inactive merchants.
  - Public storefront/search already filter active merchants through existing `USERS.STATUS = 'ACTIVE'` joins.
- [T] Fixed receipt and order chat flows.
  - `src/pages/merchant/MerchantOrders.jsx` now wires the Print Receipt button to a printable merchant receipt.
  - `src/pages/customer/Orders.jsx` now shows a centered Opening IskoChat modal, creates/opens the merchant thread, and routes to customer messages.
  - `src/pages/customer/Messages.jsx` now selects the merchant thread passed from the orders page.
- [T] Consolidated merchant Earnings and Analytics into Insights.
  - Added `api/merchant_insights.php` to return merged revenue, customer, trend, performer, deduction, and inventory data.
  - Added `src/pages/merchant/MerchantInsights.jsx` as the combined merchant view.
  - Updated routes, sidebar navigation, and dashboard stat links to use `/merchant/insights`.
  - Old `/merchant/analytics` and `/merchant/earnings` routes redirect to `/merchant/insights`; the old frontend pages were removed.
- Validation performed for this batch:
  - `C:\xampp\php\php.exe -l api/merchant_profile.php`
  - `C:\xampp\php\php.exe -l api/checkout.php`
  - `C:\xampp\php\php.exe -l api/customer_voucher.php`
  - `C:\xampp\php\php.exe -l api/merchant_insights.php`
  - `npm run build`

### Code review remediation and local reset-link handling (May 19, 2026)

- [T] Added rate limiting to login, forgot-password, and password-change flows.
- [T] Added real customer and merchant password-change support through `api/change_password.php`.
- [T] Kept local-demo reset links available only when `APP_ENV=local` and removed reset-link logging.
- [T] Replaced request-time schema mutation with explicit schema-column validation helpers.
- [T] Exposed uploaded GCash proof links in merchant order review.
- [T] Enabled customer and merchant conversation search.
- [T] Persisted customer preferences locally and removed misleading modal action-detail panels.
- [T] Aligned AI help currency wording with the rest of the app and fixed the merchant insights duplicate-placeholder 500.
- Validation performed for this batch:
  - `npm run lint`
  - `npm run build`
  - `C:\xampp\php\php.exe -l` for touched PHP endpoints

### Footer link population and booking cart polish (May 19, 2026)

- [T] Populated the customer footer with editable link arrays in `src/components/Footer.jsx`.
- [T] Kept Customer Support links as placeholder anchors for now so they do not route to missing pages.
- [T] Updated service booking cart behavior so repeated service additions create separate booking rows instead of increasing a merged quantity.
- [T] Updated wishlist availability handling so products with no stock and services with no slots cannot be added from wishlist.
- Validation performed for this batch:
  - `npm run lint`
  - `npm run build`
  - `C:\xampp\php\php.exe -l api\customer_wishlist.php`
