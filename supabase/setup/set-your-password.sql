-- Setting a password for your own account.
--
-- Sign in links need email, and email is not connected yet, so the way
-- in is a password. This sets one for a single account.
--
-- Change both values before running it. Use a real password, not this
-- one, and change it again in Settings once you are in.

update auth.users
set encrypted_password = crypt('change-this-to-a-real-password', gen_salt('bf')),
    updated_at = now()
where email = 'realexpatpreneur@gmail.com';

-- Check it took. One row, with a password set.
select email, (encrypted_password is not null) as has_password, last_sign_in_at
from auth.users
where email = 'realexpatpreneur@gmail.com';