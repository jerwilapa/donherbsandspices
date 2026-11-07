# donherbsandspices

## Local setup

### Firebase

1. Create a Firebase project and enable Cloud Firestore in Native mode.
2. Copy `don-backend/.env.example` to `don-backend/.env`; set
   `FIREBASE_PROJECT_ID`, a random `JWT_SECRET` of at least 32 characters, and
   `CORS_ORIGINS`.
3. For local backend access, create a service account with Firestore access and
   set `GOOGLE_APPLICATION_CREDENTIALS` to its JSON file path. Do not commit the
   credential file. On managed Google Cloud deployments, prefer workload
   identity/application default credentials.
4. Deploy the restrictive `firestore.rules` rules. The backend uses the Admin
   SDK and its JWT-protected API; browser clients should not access collections
   directly.
5. Register an account, then assign its admin role in the Firestore console:
   edit `users/{numeric-user-id}` and set `role` to `admin`.

The backend now stores users, products, categories, carts, favorites, addresses,
and orders in Firestore. The existing login/JWT authentication remains in place.

### Run the app

Install backend dependencies in `don-backend` and run `npm run dev`. Install
frontend dependencies in `don-frontend` and run `npm run dev`. Firebase
credentials and mail notifications still require their own configuration.

### Migrating existing MySQL records

The migration script copies all existing application tables and preserves their
numeric IDs, product prices, password hashes, addresses, cart contents, and order
history. Keep the old MySQL database backed up and do not accept writes during
the final migration/cutover.

1. Install backend dependencies, which include `mysql2` only as a development
   dependency for this one-time migration.
2. Set `SOURCE_DB_HOST`, `SOURCE_DB_PORT`, `SOURCE_DB_USER`,
   `SOURCE_DB_PASSWORD`, and `SOURCE_DB_NAME` for the source database in the
   backend environment. Set the Firebase project and credentials above.
3. From `don-backend`, run `node scripts/migrate-mysql-to-firestore.cjs`.
   The default is a read-only dry run; compare the row counts with the source.
4. Back up MySQL and verify that the configured Firebase project is the intended
   target. Then rerun with `FIRESTORE_MIGRATION_DRY_RUN=false` and
   `FIRESTORE_MIGRATION_CONFIRM=YES`.
5. Verify the migrated users, products, orders, stock, and images before
   switching traffic. Keep the MySQL backup until the migration is verified.

The importer is idempotent by document ID. Do not run it while users are making
changes: records changed during the copy need a final consistency check.

### Production configuration

Set `NODE_ENV=production`, `FIREBASE_PROJECT_ID`, `JWT_SECRET`, `CORS_ORIGINS`,
and `PORT` in the backend deployment environment. Supply Google Application
Default Credentials/workload identity or `FIREBASE_SERVICE_ACCOUNT`. Use HTTPS
origins and keep secrets out of source control. Set `VITE_API_URL` to the HTTPS
backend API base URL when building the frontend; production builds fail if it is
missing or not HTTPS. Uploaded product and category images are still served from
the backend upload directory and need persistent storage or an external object
store in deployment.