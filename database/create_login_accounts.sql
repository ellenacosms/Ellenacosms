-- ELLENA administrator and customer login accounts
-- Import into the same MySQL database used by the website.
--
-- Temporary credentials:
-- Admin:    admin@ellena.test / EllenaAdmin2026!
-- Customer: customer@ellena.test / EllenaCustomer2026!
--
-- Existing accounts with these email addresses will have their passwords
-- reset to the temporary passwords above.

SET NAMES utf8mb4;

INSERT INTO `users` (
    `name`,
    `email`,
    `email_verified_at`,
    `password`,
    `is_admin`,
    `remember_token`,
    `created_at`,
    `updated_at`
) VALUES (
    'Ellena Administrator',
    'admin@ellena.test',
    CURRENT_TIMESTAMP,
    '$2y$12$4QR63zdbjipthbDg8BXca.iHnLqEJHYrfATBFfUw8S3dES/25knDO',
    1,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
    `name` = 'Ellena Administrator',
    `email_verified_at` = CURRENT_TIMESTAMP,
    `password` = '$2y$12$4QR63zdbjipthbDg8BXca.iHnLqEJHYrfATBFfUw8S3dES/25knDO',
    `is_admin` = 1,
    `remember_token` = NULL,
    `updated_at` = CURRENT_TIMESTAMP;

INSERT INTO `users` (
    `name`,
    `email`,
    `email_verified_at`,
    `password`,
    `is_admin`,
    `remember_token`,
    `created_at`,
    `updated_at`
) VALUES (
    'Demo Customer',
    'customer@ellena.test',
    CURRENT_TIMESTAMP,
    '$2y$12$1WNll29cfggXf5GsaXTsd.sBfvQA8EST3Yhf7/6E.eevfjbxP9d26',
    0,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
    `name` = 'Demo Customer',
    `email_verified_at` = CURRENT_TIMESTAMP,
    `password` = '$2y$12$1WNll29cfggXf5GsaXTsd.sBfvQA8EST3Yhf7/6E.eevfjbxP9d26',
    `is_admin` = 0,
    `remember_token` = NULL,
    `updated_at` = CURRENT_TIMESTAMP;
