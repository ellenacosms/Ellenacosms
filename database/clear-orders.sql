-- ELLENA: clear test orders safely
--
-- This script deletes every order and its cascaded order items/payment events.
-- It restores stock and discount usage only for orders whose resources are
-- still reserved. It does NOT touch products, customers, newsletter
-- subscribers, admins, categories, settings, or migrations.
--
-- Run only against the intended database, once you have exported a backup.

SELECT COUNT(*) AS orders_to_delete FROM orders;

START TRANSACTION;

CREATE TEMPORARY TABLE order_stock_to_restore AS
SELECT
    order_items.product_id,
    SUM(order_items.quantity) AS quantity
FROM order_items
INNER JOIN orders ON orders.id = order_items.order_id
WHERE orders.resources_released_at IS NULL
  AND order_items.product_id IS NOT NULL
GROUP BY order_items.product_id;

UPDATE products
INNER JOIN order_stock_to_restore
    ON order_stock_to_restore.product_id = products.id
SET products.stock = products.stock + order_stock_to_restore.quantity;

CREATE TEMPORARY TABLE discount_uses_to_restore AS
SELECT
    orders.discount_id,
    COUNT(*) AS usage_count
FROM orders
WHERE orders.resources_released_at IS NULL
  AND orders.discount_id IS NOT NULL
GROUP BY orders.discount_id;

UPDATE discounts
INNER JOIN discount_uses_to_restore
    ON discount_uses_to_restore.discount_id = discounts.id
SET discounts.times_used = GREATEST(
    0,
    discounts.times_used - discount_uses_to_restore.usage_count
);

-- order_items and order_payment_events are deleted automatically by their
-- foreign-key cascade when their parent order is removed.
DELETE FROM orders;

COMMIT;

SELECT COUNT(*) AS remaining_orders FROM orders;
