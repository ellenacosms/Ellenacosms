-- Fix for:
-- SQLSTATE[42S02]: Table 'ellenaco_ellena01.banners' doesn't exist
--
-- Import this file into the ellenaco_ellena01 MySQL database.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `banners` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `placement` VARCHAR(255) NOT NULL DEFAULT 'hero',
    `eyebrow` VARCHAR(255) NULL DEFAULT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` TEXT NULL,
    `image` VARCHAR(2048) NOT NULL,
    `mobile_image` VARCHAR(2048) NULL DEFAULT NULL,
    `cta_label` VARCHAR(255) NULL DEFAULT NULL,
    `cta_url` VARCHAR(2048) NULL DEFAULT NULL,
    `text_position` VARCHAR(255) NOT NULL DEFAULT 'left',
    `overlay_opacity` TINYINT UNSIGNED NOT NULL DEFAULT 10,
    `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `starts_at` TIMESTAMP NULL DEFAULT NULL,
    `ends_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mark the matching Laravel migration as applied so a future
-- `php artisan migrate` does not try to create this table again.
INSERT INTO `migrations` (`migration`, `batch`)
SELECT
    '2026_07_23_000003_create_banners_table',
    COALESCE((SELECT MAX(`batch`) FROM `migrations` AS `migration_batches`), 0) + 1
WHERE NOT EXISTS (
    SELECT 1
    FROM `migrations`
    WHERE `migration` = '2026_07_23_000003_create_banners_table'
);
