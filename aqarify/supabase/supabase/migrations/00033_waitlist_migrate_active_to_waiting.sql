-- Runs after 00031 commits so `waiting` is a usable enum value.
UPDATE waiting_list SET status = 'waiting' WHERE status = 'active';
