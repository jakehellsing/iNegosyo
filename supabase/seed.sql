-- Sample seed data for local development
-- Replace the user_id value with an authenticated user UUID before running.

INSERT INTO customers (user_id, name, phone_number, address, notes)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Sample Customer',
    '09171234567',
    'Manila, Philippines',
    'Loves ube halaya'
)
RETURNING id;

INSERT INTO orders (user_id, customer_id, product_name, quantity, unit_price, payment_status, delivery_method, order_status, notes)
SELECT
    '00000000-0000-0000-0000-000000000000' AS user_id,
    c.id AS customer_id,
    'Ube Halaya Jar' AS product_name,
    2 AS quantity,
    250.00 AS unit_price,
    'UNPAID' AS payment_status,
    'PICKUP' AS delivery_method,
    'PENDING' AS order_status,
    'Please message before pick-up.' AS notes
FROM customers c
WHERE c.name = 'Sample Customer';
