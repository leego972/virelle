-- Virelle Studios: second admin full-access promotion
-- Safe to run repeatedly. This promotes the existing registered account only.
-- It does not store or change passwords.

UPDATE users
SET
  role = 'admin',
  subscriptionTier = 'industry',
  subscriptionStatus = 'active',
  updatedAt = NOW()
WHERE LOWER(email) = 'brobroplzcheck@gmail.com';
