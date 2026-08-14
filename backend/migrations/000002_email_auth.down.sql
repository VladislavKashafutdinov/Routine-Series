DROP INDEX idx_activities_user_id;

ALTER TABLE activities DROP COLUMN user_id;

DROP TABLE sessions;

DROP TABLE login_codes;

DROP TABLE users;
