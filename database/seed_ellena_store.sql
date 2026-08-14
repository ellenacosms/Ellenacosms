-- ELLENA canonical MySQL seed data
-- Import after ellena_mysql_schema.sql.
-- Safe to import repeatedly: unique records are updated, not duplicated.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- Login accounts
-- Admin:    admin@ellena.test / EllenaAdmin2026!
-- Customer: customer@ellena.test / EllenaCustomer2026!
INSERT INTO `users`
    (`name`, `email`, `email_verified_at`, `password`, `is_admin`, `created_at`, `updated_at`)
VALUES
    (
        'Ellena Administrator',
        'admin@ellena.test',
        CURRENT_TIMESTAMP,
        '$2y$12$4QR63zdbjipthbDg8BXca.iHnLqEJHYrfATBFfUw8S3dES/25knDO',
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'Demo Customer',
        'customer@ellena.test',
        CURRENT_TIMESTAMP,
        '$2y$12$1WNll29cfggXf5GsaXTsd.sBfvQA8EST3Yhf7/6E.eevfjbxP9d26',
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `email_verified_at` = VALUES(`email_verified_at`),
    `password` = VALUES(`password`),
    `is_admin` = VALUES(`is_admin`),
    `updated_at` = CURRENT_TIMESTAMP;

-- Product categories
INSERT INTO `categories`
    (`name`, `slug`, `description`, `image`, `is_active`, `created_at`, `updated_at`)
VALUES
    (
        'Skin Care',
        'skin-care',
        'High-performance formulas for luminous, resilient skin.',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC1En3AHkOc8lM-6Zs9bBC2wLMhvYj9f9cKU9FEiA7uRlM58eig75zY9vezyIk6hOXO9VsW_Hk-FYNMbDHkkqoCtwfQpaZ3XoroGVjBjokIZr4SaVe2l8li8xRlprhr5-JY2jDkSLpPofdr34idabM1e3H9D81MBhe9DknoJ3fZFRzEyrDbcCZfY9ZGhlAHbpsROHRMYmo1Pss6yfs_CfA8YEvFA8NB07MDVlZVadV4lKwgK4fDU1FsLA',
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'Makeup',
        'makeup',
        'Modern color, exquisite textures, and confident finishes.',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDdNo9UjgPSBhbKbp0AgnI2kfM_Yv6Jv2VHoytc6I9AbysLsXwLwLnFnxvzgQrI_kn-zjPbOM1QlDY0iRVqv6Uwx3Q0FqVOTi22k2kDBa52a8PVGrg1unXTI_glP0WcHoU_KhO_TqRfus6ObOpnYy65chyPIDXwO8I7k3M4kT4PzAtbPTV-Pt_CPIM3X-CFILlu7dn8aRhGxEI58Q8z4xRcnlqBKzggD5xhF8Vn7Rf_VdyCQ69oQ6sUEQ',
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'Fragrance',
        'fragrance',
        'Quietly expressive compositions with a lasting signature.',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAU3WIWbgCwczq2kR21oEo1D2RKe55uJQXkH4wGzA5w3dUfflgCQ1LGaq7R7ts2FFd-SFmZvypF-nc94zoWPHubd_EsGz44H2IbbH8taPz3RaCZ_1y0m1xgXh7UhMBMhmz_b7eQBpl1ZF1H2p7pddz6jGA5hb14hFT3CGkopWP3G7wrqAtKYdkJT80jujO6jVOo1b_MGSKkaYy5rUtHEtRoqXls-GLr6E5bhbSWGkPL2aZj3AN8xL-kgw',
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `description` = VALUES(`description`),
    `image` = VALUES(`image`),
    `is_active` = VALUES(`is_active`),
    `updated_at` = CURRENT_TIMESTAMP;

-- Store products
INSERT INTO `products`
    (`category_id`, `name`, `slug`, `sku`, `subtitle`, `description`, `ingredients`, `usage`,
     `price`, `compare_price`, `stock`, `images`, `is_featured`, `is_active`, `created_at`, `updated_at`)
VALUES
    (
        (SELECT `id` FROM `categories` WHERE `slug` = 'skin-care' LIMIT 1),
        'Radiance Elixir Serum',
        'radiance-elixir-serum',
        'EL-SKN-001',
        'Concentrated luminosity serum',
        'A revolutionary serum formulated with molecular-precision hyaluronic acid and botanical stem cells to deliver instantaneous luminosity and deep cellular rejuvenation. Designed for discerning skin seeking an aura of pure refinement.',
        'Multi-Weight Hyaluronic Acid — deeply hydrates through all skin layers.\n\n24K Gold Micro-Flakes — visibly brighten and calm inflammation.\n\nAlpine Rose Stem Cells — support vitality and improve barrier function.',
        'Apply 3–4 drops to cleansed, slightly damp skin. Press into face, neck, and décolletage with upward motions. Follow with moisturizer. Use morning and night.',
        145.00,
        NULL,
        28,
        JSON_ARRAY(
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAGt6SZkdquq77e5ZBqRm5b_ojbF46GinPUCbL13v1V0bjceLfUKPmvICOTIUZ8osi6SFvxy1JxGi42duZ908act9yPdFOvin7WZ8i603tnWUDUGSVdifDfBu7rEhWhvH1AVKoMQElZ-54CVbswaB8iBXZGaiivD6XvyhA4xTwZgr7ZAcbnrRDi-pFVx_qP_zY2ce_H1Rj57WpFbG7jhGyHDoW8FTI94aVsgromtgur4ozxXhE-m3M-CA',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCA1065i138k2_azt3MrePWdIzCZVVo9Yd8IKZgTR2lQptm7eG6lGRCzYHpyHMW2Vh4EiV5qQwiLdPybFxNbryP4c5v8KJ7lm9-sBNPyHnGA_7XvI-AEVOuLQQZZDKX_L5tu7ft-U0qg3HV67kyMTksi9dAebrhPcgnEAbWty9W7vsLRyyJ6H_9UAnkeg-g9mR8pVY90BfyjfYZzxbLdRqWvyfBELiSPIcTO_oqA5cSkz2SxaV4mt52qA',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDV0-qqIHM75gnvmeaIRyxzgXzuaha963xNHaGhSKbvmuVEYtMa__7LcxntMozl0GEN5aEoglWlqQhNqO6JlLERQFPurFd-JoBp6X9qZb2Cj8vLTpoEwJZjz9eNLcsxTBvHDCeg40aVk9rciVi7k2xosKyZvLD1DWhvpqWEH7YB7sz7Xh2L_CzBkN6XHIMIsOEgTcDqn50oNNnRM_4CO-BVSDEUCLxxE15dA6PDawGN7Ba3Ohy8Q4Z-EQ',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBv8WoUwHpb-d75SFPIYk0XRNAPJuPjTRycGfWBmbVv1XqX_sPqQXA9ym9Z4Ld0EfxaJIMABEZoxdZZc1DxebjpfeQnZexQl2fzzpZ6SU9pPlyphYKlwZoDeKvB3xyo5Vp8cUBjkCVdus-b--Cly9jAsDL3O9yuce75O7K6Sh6BVUdzLvGz6oiIePqVo3OilXCL_jkvMAe3E1DWzYd79B1vePg2gBVvHyiBav5ZFyyszRECSJl2vjSoXg'
        ),
        1,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        (SELECT `id` FROM `categories` WHERE `slug` = 'makeup' LIMIT 1),
        'Velvet Matte Rose',
        'velvet-matte-rose',
        'EL-MKP-001',
        'Signature lipstick',
        'A saturated rose pigment suspended in a featherlight velvet matrix for sculpted color and a softly diffused finish.',
        'Camellia oil, rose wax, mineral pigments, and vitamin E.',
        'Apply directly from the bullet or use a lip brush for precise definition.',
        48.00,
        NULL,
        42,
        JSON_ARRAY('https://lh3.googleusercontent.com/aida-public/AB6AXuBeqPKeIsqFx1pUx0bmQdm7Tc7kl9Tfi6_eHqLSlm7gw7Zc7sQrkNApFV22Mm-vahXYgpsOH2iAeDPMg4T_8xxZtJ_-sJI38G37S0iyrOSRaHuG4vcrs2ymHFsAVO_9kzj4tOw5rzvD77fLKrHqqvduUFiJ0yNe23iY0kXG4vzCC3Ffz8N9vRQZsDkIKjjqn7I1dGvgbCh18sS9Va0IPx4Z6wKBKUOQLWmdteYHVIu8Gk_W4pSs53ipYw'),
        1,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        (SELECT `id` FROM `categories` WHERE `slug` = 'skin-care' LIMIT 1),
        'Midnight Recovery Cream',
        'midnight-recovery-cream',
        'EL-SKN-002',
        'Restorative night care',
        'A cocooning night treatment that helps replenish lipids, soothe visible stress, and restore morning radiance.',
        'Ceramide complex, ectoin, squalane, and blue tansy.',
        'Massage a pearl-sized amount over face and neck as the final step in your evening ritual.',
        120.00,
        NULL,
        8,
        JSON_ARRAY('https://lh3.googleusercontent.com/aida-public/AB6AXuAiFiPc3X3UDcMM68TWuGU4kmHFjpBkwKOke1pV3erlICgMa4dToUsQ4ZFEGt9i5J0z2a7gGruW7MryAzGfYbA64jzCwqswH0Rkg3uzokv6tLlQ2rat9jYR12YEgQjzxpk-2LfEevouHCx86wFDcZ-Va1JbKvH12BQv8T9tRZYNmdtGA6j6xvB6A9w0nV7sBmQkz51CkccTGIBaaYvFRQeoQBLsLD4XQFweGC9KDssHI2ydS1pfJM0VCQ'),
        1,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        (SELECT `id` FROM `categories` WHERE `slug` = 'skin-care' LIMIT 1),
        'Hydra Veil Mist',
        'hydra-veil-mist',
        'EL-SKN-003',
        'Refreshing essence toner',
        'An ultrafine mineral mist that layers weightless hydration and restores fresh luminosity throughout the day.',
        'Hyaluronic acid, mineral water, snow mushroom, and panthenol.',
        'Mist over clean skin before serum, or over makeup whenever skin needs replenishment.',
        62.00,
        NULL,
        34,
        JSON_ARRAY('https://lh3.googleusercontent.com/aida-public/AB6AXuBcyWmq4-Hw8E608Fmv-kr1I_v3X9rYA7KACp2BzG04BdQjxjAln9BPB4EtfmhH2ehsFvqXkNFYSIKZ0FyPLxjVo8f9UfS_wFgxeD3-5ELN7SxaLPImAeEhlVpQAjmh3KDys6Fb6870R2DnynXRxjeoyh9J78vxeC7If8qSEfeC9F6NcKVZ7dt6swvrZ7u_Vn0tvbxPz6dd7q5rOmfxeVa9SJzBRlNEGG0dVD0K-IoiJd3DI7Fm2m8h6w'),
        1,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        (SELECT `id` FROM `categories` WHERE `slug` = 'makeup' LIMIT 1),
        'Silk Canvas Primer',
        'silk-canvas-primer',
        'EL-MKP-002',
        'Perfecting base',
        'A breathable, soft-focus veil that smooths texture and extends makeup wear without masking the skin.',
        'Silk powder, niacinamide, glycerin, and white peony.',
        'Press a small amount over moisturized skin, concentrating on areas where texture is visible.',
        85.00,
        NULL,
        19,
        JSON_ARRAY('https://lh3.googleusercontent.com/aida-public/AB6AXuAkIwxG9RYOxXgXlVk4l7x5-UPT23XUjDQWIvlpsqle-uUeAcZrshJebKxDX-Him-0LLvUkV_F-6vYnCtOp6FGLGhCZMTTdmcvRI7haunCVyKuMT5mAoKx8wW8_OKJth2s10UukG-_vjOAyGjZ0HEYx9xwEbx_S3GchAJVzdDpBv0xpYhrIglDi0T6WcZmg02-VJ7KmxhfRgn07NxKz3Or0p7Ec8bqnXCTU-NNcVM1af0FXIslMk3e08g'),
        0,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        (SELECT `id` FROM `categories` WHERE `slug` = 'skin-care' LIMIT 1),
        'Rose Gold Cleansing Oil',
        'rose-gold-cleansing-oil',
        'EL-SKN-004',
        'Infused nourishment',
        'A silken botanical oil that dissolves makeup and daily impurities, rinsing clean without disturbing the skin barrier.',
        'Rosehip, camellia, meadowfoam, and bisabolol.',
        'Massage onto dry skin, emulsify with warm water, and rinse thoroughly.',
        72.00,
        NULL,
        25,
        JSON_ARRAY('https://lh3.googleusercontent.com/aida-public/AB6AXuDRefjRuy6IPFmSbFOM0szSpjoBRevRrGzG_gQnJz6QDZoXScbuMqb959Ty7SRznxcW4V1UhWd0fpXWXFvmVqBwsZXihakNooZymoQmOJUVVWspfayCbbRkMtRvurWc6kH1qjQGVVCKbw7BWhsJd-IiyVapXU2oxbgL9yj46nW4dFb468hLBV_R6qoFbueSgMKpUGtDofJ3MfKvh9Swbu6GvQNBiL-PlKwbNGNbkSGupO9Ktr8r43wTuw'),
        0,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        (SELECT `id` FROM `categories` WHERE `slug` = 'skin-care' LIMIT 1),
        'Peptide Lip Treatment',
        'peptide-lip-treatment',
        'EL-SKN-005',
        'Barrier support',
        'A cushiony, non-sticky lip treatment that visibly smooths, nourishes, and restores supple comfort.',
        'Palmitoyl tripeptide, shea butter, ceramides, and hyaluronic acid.',
        'Apply throughout the day and as a generous overnight treatment.',
        38.00,
        NULL,
        3,
        JSON_ARRAY('https://lh3.googleusercontent.com/aida-public/AB6AXuA6-rOklK9eGZ2ethmdUep5RAU_VKEcUs1d_DA7tj_Jp5MFCaTqQYqcMBawCyoRNy1nCrpoBvnVNntuxk87WPcu6XqLFjp-1KjeK1Que93dzCsrIKIl8-2e9lqPUqgd7Q9r4r_JKzZBgzj5uWxp4WaPNzLDeb92OHiWRs9uJArdjTesIjtMQO5QTwgnX2rbTIOvnkVYPBrKSZYDtxIbF-6mWX3WusHKVhVxez46K9ktIPiT_x2q0WHmAw'),
        0,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        (SELECT `id` FROM `categories` WHERE `slug` = 'fragrance' LIMIT 1),
        'No. 01 Santal Lumière',
        'no-01-santal-lumiere',
        'EL-FRG-001',
        'Eau de parfum',
        'A luminous study in sandalwood, opening with bergamot before settling into iris, skin musk, and polished woods.',
        'Bergamot, orris, sandalwood, ambrette, and white musk.',
        'Mist onto pulse points and allow the composition to evolve naturally on skin.',
        165.00,
        NULL,
        14,
        JSON_ARRAY('https://lh3.googleusercontent.com/aida-public/AB6AXuAU3WIWbgCwczq2kR21oEo1D2RKe55uJQXkH4wGzA5w3dUfflgCQ1LGaq7R7ts2FFd-SFmZvypF-nc94zoWPHubd_EsGz44H2IbbH8taPz3RaCZ_1y0m1xgXh7UhMBMhmz_b7eQBpl1ZF1H2p7pddz6jGA5hb14hFT3CGkopWP3G7wrqAtKYdkJT80jujO6jVOo1b_MGSKkaYy5rUtHEtRoqXls-GLr6E5bhbSWGkPL2aZj3AN8xL-kgw'),
        0,
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON DUPLICATE KEY UPDATE
    `category_id` = VALUES(`category_id`),
    `name` = VALUES(`name`),
    `sku` = VALUES(`sku`),
    `subtitle` = VALUES(`subtitle`),
    `description` = VALUES(`description`),
    `ingredients` = VALUES(`ingredients`),
    `usage` = VALUES(`usage`),
    `price` = VALUES(`price`),
    `compare_price` = VALUES(`compare_price`),
    `stock` = VALUES(`stock`),
    `images` = VALUES(`images`),
    `is_featured` = VALUES(`is_featured`),
    `is_active` = VALUES(`is_active`),
    `updated_at` = CURRENT_TIMESTAMP;

-- Discounts
INSERT INTO `discounts`
    (`name`, `code`, `type`, `value`, `minimum_order`, `usage_limit`, `times_used`,
     `starts_at`, `ends_at`, `is_active`, `created_at`, `updated_at`)
VALUES
    (
        'Private List Welcome', 'WELCOME15', 'percentage', 15.00, 80.00, 250, 0,
        NULL, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ),
    (
        'Complete Ritual', 'RITUAL25', 'fixed', 25.00, 200.00, 100, 0,
        NULL, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `type` = VALUES(`type`),
    `value` = VALUES(`value`),
    `minimum_order` = VALUES(`minimum_order`),
    `usage_limit` = VALUES(`usage_limit`),
    `is_active` = VALUES(`is_active`),
    `updated_at` = CURRENT_TIMESTAMP;

-- Product reviews. The NOT EXISTS checks make these repeatable even though
-- the reviews table does not define a unique email/product constraint.
INSERT INTO `reviews`
    (`product_id`, `user_id`, `customer_name`, `email`, `rating`, `title`, `body`,
     `is_approved`, `created_at`, `updated_at`)
SELECT
    (SELECT `id` FROM `products` WHERE `slug` = 'radiance-elixir-serum' LIMIT 1),
    (SELECT `id` FROM `users` WHERE `email` = 'customer@ellena.test' LIMIT 1),
    'Isabella V.',
    'isabella@example.com',
    5,
    'Immediate luminosity',
    'The texture is pure silk on the skin and the luminosity is immediate. It has become the flagship of my evening ritual.',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM `reviews`
    WHERE `email` = 'isabella@example.com'
      AND `product_id` = (
          SELECT `id` FROM `products`
          WHERE `slug` = 'radiance-elixir-serum'
          LIMIT 1
      )
);

INSERT INTO `reviews`
    (`product_id`, `user_id`, `customer_name`, `email`, `rating`, `title`, `body`,
     `is_approved`, `created_at`, `updated_at`)
SELECT
    (SELECT `id` FROM `products` WHERE `slug` = 'radiance-elixir-serum' LIMIT 1),
    NULL,
    'Amira K.',
    'amira@example.com',
    4,
    'Beautiful texture',
    'A refined serum with a weightless finish. I noticed softer, more rested-looking skin within the first week.',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM `reviews`
    WHERE `email` = 'amira@example.com'
      AND `product_id` = (
          SELECT `id` FROM `products`
          WHERE `slug` = 'radiance-elixir-serum'
          LIMIT 1
      )
);

-- Store settings
INSERT INTO `store_settings` (`key`, `value`, `created_at`, `updated_at`)
VALUES
    ('store_name', 'ELLENA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('support_email', 'concierge@ellena.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('currency', 'UGX', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('free_shipping_threshold', '150', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('low_stock_threshold', '10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('order_prefix', 'ELN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
    `value` = VALUES(`value`),
    `updated_at` = CURRENT_TIMESTAMP;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
