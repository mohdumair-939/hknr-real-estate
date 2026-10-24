-- Separate database for automated tests so they never touch development data.
CREATE DATABASE hknr_test OWNER hknr;
CREATE DATABASE hknr_e2e OWNER hknr;
