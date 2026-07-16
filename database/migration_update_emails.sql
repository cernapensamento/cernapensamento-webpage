UPDATE auth.users
SET email = REPLACE(email, '@cerna.com', '@cernapensamento.org')
WHERE email IN (
  'diegoaraujo@cerna.com',
  'hectorgonzalez@cerna.com',
  'denisfernandez@cerna.com',
  'anxoperez@cerna.com'
);
