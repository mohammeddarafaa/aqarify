-- Remove empty-string default so UNIQUE never competes with '' before trigger fills the value.
ALTER TABLE reservations ALTER COLUMN confirmation_number DROP DEFAULT;
