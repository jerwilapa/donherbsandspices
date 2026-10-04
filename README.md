# donherbsandspices

## Local setup

### Database

1. Install and start MySQL Server.
2. Run `database/don_schema.sql` in MySQL Workbench, or from Command Prompt/Git Bash:

	```sh
	mysql -u root -p < database/don_schema.sql
	```

	The script creates the `don` database and all tables used by the backend. It
	is safe to run again and does not delete existing data. It seeds the order
	statuses; products, categories, and accounts must be added separately.
3. Copy `don-backend/.env.example` to `don-backend/.env` and set the MySQL
	username, password, and any other values for your machine.
4. Register an account through the app, then promote it to admin if needed:

	```sql
	USE don;
	UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
	```

### Run the app

Install backend dependencies in `don-backend` and run `npm run dev`. Install
frontend dependencies in `don-frontend` and run `npm run dev`. Firebase and mail
notifications still require their own credentials/configuration; the database
script does not recreate those external services or restore previous laptop data.