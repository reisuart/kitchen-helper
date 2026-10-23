# Kitchen Helper

A responsive kitchen planner for two: pantry lots and expiry dates, barcode lookup/camera scanning, favorite recipes with flexible ingredient categories, meal calendar, household preferences, and stock-aware shopping lists.

## Run locally

Install Node.js 22 or newer. No package installation required.

```
npm test
npm run dev
```

Open http://127.0.0.1:4173. Without Supabase, the app uses clearly labeled sample data saved in this browser only. Demo data is never automatically uploaded. Each pantry entry is a separate lot; edit its remaining quantity after using food. Planning does not consume pantry records.

## Private Supabase setup

1. Create a project at https://supabase.com/dashboard. Choose the region you prefer.
2. In Authentication > Users, create your own email/password user using the dashboard. Store the password in your password manager.
3. Disable **Allow new users to sign up** in Authentication settings. Keep anonymous sign-in disabled. There is no sign-up interface in this app.
4. Copy your user's UUID. In `supabase/setup.sql`, replace `REPLACE_WITH_YOUR_USER_UUID` with it. Run the entire file once in Supabase SQL Editor. Do this in the dashboard; keep the placeholder in the public repo if preferred. The transaction fails closed if the placeholder has not been replaced.
5. Find the project URL and public publishable/anon key in the project's API settings. Click **Connect Supabase** in the app and enter them. These are public client configuration, not secrets. Never supply a service-role or secret key.
6. Sign in with the account you created. The production kitchen starts empty, separate from local sample data. For shared configuration across devices, set `supabaseUrl` and `supabaseKey` in `dist/config.js` before deployment. Alternatively connect each browser individually.

The database grants authenticated users only SELECT and UPDATE on kitchen data. Row level security requires both the matching user ID and membership in the owner allowlist. Anonymous visitors and other authenticated accounts cannot access the records. Client code cannot add owners, insert kitchens, or delete the kitchen row. The owner table is protected too. Public code and public Supabase keys do not grant access to private records.

Validate after setup: signed-out requests must return no records; a different test user must return no records and must not be able to update your row; your owner account must read and update its row. Database integration tests require your live project and have not been run locally. Data updates use optimistic version checks to avoid silently overwriting another tab's changes. Reload on a version conflict.

Documentation: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/auth/general-configuration.

## Public GitHub repository + GitHub Pages

GitHub Pages is available with GitHub Free for public repositories. The static frontend is public; household records stay in Supabase.

1. Create a new public GitHub repository named `kitchen-helper` (do not initialize it with files).
2. Push this directory as the repository root. Example from this directory:

```
git init
git add .
git commit -m "Build Kitchen Helper"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kitchen-helper.git
git push -u origin main
```

3. In repository Settings > Pages, choose **GitHub Actions** as the source.
4. Run the included **Deploy GitHub Pages** workflow, or push another commit. It tests the shopping calculations and deploys only `dist`.
5. Open the Pages URL returned by the workflow. Relative asset paths support repository subpaths.

Never commit personal food data, backups, passwords, database exports, or secret keys. No GitHub credentials are configured in this checkout. The workflow is prepared but a GitHub repository has not been created or deployed by this project.

## Current behavior and limits

- Camera barcode scanning uses BarcodeDetector where supported and a pinned ZXing browser decoder (`@zxing/browser@0.1.5`) loaded from jsDelivr for Safari and other browsers. Camera access requires HTTPS or localhost; permission is requested only when scanning. Camera frames stay on-device. Closing the scanner releases the camera, including when a permission request finishes late. Manual barcode entry remains available. Open Food Facts supplies names where available; verify the packaging. Barcode numbers are sent to Open Food Facts for lookup, not your household inventory. https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/
- Add recipe ingredients with individual form rows. Choose a specific ingredient (with suggestions from your pantry and recipes) or a flexible category such as Carbs. Quantities are optional: leave them blank to cook by feel. Existing recipe quantities remain intact when edited.
- The shopping algorithm allocates measured amounts from compatible pantry lots in expiry order to meals in date order, scaling by servings. Ingredients without quantities remain under **Check amounts**, showing **Have some · check amount** or **Buy as needed**. They are not silently treated as covered, and no amount is deducted or invented. Exports preserve these reminders. The app does not convert grams to pieces or millilitres; expired stock is excluded on each meal's date.
- Preference warnings compare tags and ingredient text; they are not an allergy certification. Notes are saved for reference. Vegetarian/vegan warnings are basic text checks; add explicit avoid terms for other diets and restrictions.
- The planner supports 1–31 days, lunch and dinner, with drag-and-drop and a button alternative for touch/keyboard.
- Reminders appear in-app. On iPhone/iPad with iOS 16.4 or later, add the website to the Home Screen from Safari, open its icon, sign in, and enable notifications in Household & settings. A web manifest and notification service worker support this flow. Foreground expiry checks deliver notifications using `ServiceWorkerRegistration.showNotification`; regular Safari tabs show installation instructions. The worker does not cache pages, API responses, credentials, or household data. **Closed-app email/push reminders are not implemented.** For those, add scheduled server delivery and Push API subscriptions. Keep provider credentials exclusively in server secrets.
- Supabase connection, camera hardware, and authenticated RLS behavior require live setup and device verification. Browser data backup downloads are private files; never add them to the repository.
