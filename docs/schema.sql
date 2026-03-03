-- =========================================
-- MegaStore Global — PostgreSQL Schema
-- Database: db_megastore_exam
-- Normalization: 1NF, 2NF, 3NF applied
-- =========================================

CREATE TYPE user_role AS ENUM ('admin', 'client');

-- =========================================
-- USERS (authentication identity)
-- 3NF: email/password/role are atomic, no transitive deps
-- =========================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        user_role NOT NULL DEFAULT 'client',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- =========================================
-- CLIENT (profile data separated from auth)
-- 2NF: phone/address depend only on client, not on user
-- =========================================
CREATE TABLE client (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL UNIQUE,
    phone       VARCHAR(50),
    address     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_client_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- SUPPLIER (3NF: removes supplier_name → contact transitive dep)
-- =========================================
CREATE TABLE supplier (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    email       VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_name ON supplier(name);

-- =========================================
-- DISCOUNTS (3NF: discount_name → coverage was transitive)
-- =========================================
CREATE TABLE discounts (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL UNIQUE,
    coverage_percentage NUMERIC(5,2) NOT NULL
        CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100)
);

-- =========================================
-- PRODUCT (2NF: all fields depend only on product.id)
-- =========================================
CREATE TABLE product (
    id          SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL,
    sku         VARCHAR(100) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(120),
    unit_price  NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_product_supplier
        FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT
);

CREATE INDEX idx_product_sku      ON product(sku);
CREATE INDEX idx_product_category ON product(category);
CREATE INDEX idx_product_supplier ON product(supplier_id);

-- =========================================
-- SALE (transaction record — FK to client and product)
-- =========================================
CREATE TABLE sale (
    id              SERIAL PRIMARY KEY,
    transaction_id  VARCHAR(50) UNIQUE NOT NULL,
    sale_date       TIMESTAMP NOT NULL DEFAULT NOW(),
    client_id       INTEGER NOT NULL,
    product_id      INTEGER NOT NULL,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    discounts_id    INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sale_client
        FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sale_product
        FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sale_discounts
        FOREIGN KEY (discounts_id) REFERENCES discounts(id) ON DELETE SET NULL
);

CREATE INDEX idx_sale_client  ON sale(client_id);
CREATE INDEX idx_sale_product ON sale(product_id);
CREATE INDEX idx_sale_date    ON sale(sale_date);

-- =========================================
-- REFRESH TOKENS (JWT security)
-- =========================================
CREATE TABLE refresh_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- TRIGGER: auto-update updated_at on product
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_updated_at
    BEFORE UPDATE ON product
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_client_updated_at
    BEFORE UPDATE ON client
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =========================================
-- STORED PROCEDURE: get_supplier_stats
-- =========================================
CREATE OR REPLACE FUNCTION get_supplier_stats(p_supplier_id INTEGER)
RETURNS TABLE (
    supplier_name   TEXT,
    total_products  BIGINT,
    total_sales     BIGINT,
    total_revenue   NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.name::TEXT,
        COUNT(DISTINCT p.id),
        COALESCE(SUM(sl.quantity), 0),
        COALESCE(SUM(sl.total_amount), 0)
    FROM supplier s
    LEFT JOIN product p ON p.supplier_id = s.id
    LEFT JOIN sale sl   ON sl.product_id = p.id
    WHERE s.id = p_supplier_id
    GROUP BY s.name;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- BUSINESS INTELLIGENCE VIEWS
-- =========================================

-- View: top suppliers by items sold and inventory value
CREATE VIEW v_supplier_analysis AS
SELECT
    s.id          AS supplier_id,
    s.name        AS supplier_name,
    s.email       AS supplier_email,
    COUNT(sl.id)  AS total_sales,
    COALESCE(SUM(sl.quantity), 0)             AS total_items_sold,
    COALESCE(SUM(p.unit_price * p.stock), 0)  AS inventory_value,
    COALESCE(SUM(sl.total_amount), 0)         AS total_revenue
FROM supplier s
LEFT JOIN product p ON p.supplier_id = s.id
LEFT JOIN sale sl   ON sl.product_id = p.id
GROUP BY s.id, s.name, s.email
ORDER BY total_items_sold DESC;

-- View: top products by category and revenue (with window rank)
CREATE VIEW v_top_products_by_category AS
SELECT
    p.category,
    p.id          AS product_id,
    p.name        AS product_name,
    p.sku,
    SUM(sl.quantity)     AS total_quantity_sold,
    SUM(sl.total_amount) AS total_revenue,
    RANK() OVER (PARTITION BY p.category ORDER BY SUM(sl.total_amount) DESC) AS rank_in_category
FROM product p
JOIN sale sl ON sl.product_id = p.id
GROUP BY p.category, p.id, p.name, p.sku
ORDER BY p.category, rank_in_category;

-- View: client purchase summary
CREATE VIEW v_client_summary AS
SELECT
    u.name  AS client_name,
    u.email AS client_email,
    COUNT(s.id)              AS total_orders,
    SUM(s.quantity)          AS total_items,
    SUM(s.total_amount)      AS total_spent,
    MIN(s.sale_date)         AS first_purchase,
    MAX(s.sale_date)         AS last_purchase
FROM users u
INNER JOIN client c ON c.user_id = u.id
INNER JOIN sale s   ON s.client_id = c.id
GROUP BY u.name, u.email
ORDER BY total_spent DESC;
