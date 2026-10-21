-- 001_initial_auth_and_profile.down.sql (DOWN)
DROP INDEX IF EXISTS idx_profiles_user_id;
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;
DELETE FROM _migrations WHERE name = '001_initial_auth_and_profile';
