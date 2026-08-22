ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255) NULL AFTER role;

-- Optional: verify the column was created.
SELECT id, fullname, email, fcm_token FROM users LIMIT 10;
