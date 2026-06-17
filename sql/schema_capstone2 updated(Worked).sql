-- =====================================================
-- DATABASE
-- =====================================================

DROP DATABASE IF EXISTS db_laboratorium_inventaris;
CREATE DATABASE db_laboratorium_inventaris
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE db_laboratorium_inventaris;

-- =====================================================
-- ROLES
-- =====================================================

CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(45) NOT NULL UNIQUE
);

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_photo VARCHAR(255) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    role_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
);

-- =====================================================
-- ROOMS
-- =====================================================

CREATE TABLE rooms (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(20) NOT NULL UNIQUE,
    room_name VARCHAR(100) NOT NULL,
    capacity INT UNSIGNED DEFAULT NULL,
    description TEXT DEFAULT NULL,

    created_by INT UNSIGNED NOT NULL,
    updated_by INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_rooms_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT fk_rooms_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
);

-- =====================================================
-- BHP STOCKS
-- =====================================================

CREATE TABLE bhp_stocks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    unit VARCHAR(50) NOT NULL,

    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 0,

    unit_price DECIMAL(15,2) DEFAULT NULL,

    room_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_bhp_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
);

-- =====================================================
-- PROCUREMENT DRAFTS
-- =====================================================

CREATE TABLE procurement_drafts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    year YEAR NOT NULL,

    status ENUM(
        'draft',
        'locked',
        'reviewed',
        'finalized'
    ) NOT NULL DEFAULT 'draft',

    reviewed_by INT UNSIGNED DEFAULT NULL,
    user_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_procurement_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_reviewed_by
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
);

-- =====================================================
-- PROCUREMENT ITEMS
-- =====================================================

CREATE TABLE procurement_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_type ENUM('inventaris', 'bhp') NOT NULL,
    product_name VARCHAR(150) NOT NULL,

    price DECIMAL(15,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,

    purchase_link TEXT DEFAULT NULL,

    approval_status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    bhp_stock_id INT UNSIGNED DEFAULT NULL,
    procurement_draft_id INT UNSIGNED NOT NULL,

    replaces_asset_id INT UNSIGNED DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_procurement_draft
        FOREIGN KEY (procurement_draft_id)
        REFERENCES procurement_drafts(id),

    CONSTRAINT fk_procurement_bhp
        FOREIGN KEY (bhp_stock_id)
        REFERENCES bhp_stocks(id)
);

-- =====================================================
-- INVENTORY ASSETS
-- =====================================================

CREATE TABLE inventory_assets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_name VARCHAR(150) NOT NULL,

    label_code VARCHAR(50) NOT NULL UNIQUE,

    qr_code_path VARCHAR(255) DEFAULT NULL,

    `condition` ENUM(
        'good',
        'minor_damage',
        'major_damage',
        'removed',
        'replaced'
    ) NOT NULL DEFAULT 'good',

    date_acquired DATE DEFAULT NULL,
    price DECIMAL(15,2) DEFAULT NULL,

    procurement_item_id INT UNSIGNED NOT NULL,
    room_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_procurement
        FOREIGN KEY (procurement_item_id)
        REFERENCES procurement_items(id),

    CONSTRAINT fk_inventory_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
);

-- =====================================================
-- FIX CIRCULAR FK
-- =====================================================

ALTER TABLE procurement_items
ADD CONSTRAINT fk_replaces_asset
FOREIGN KEY (replaces_asset_id)
REFERENCES inventory_assets(id);

-- =====================================================
-- MAINTENANCE LOGS
-- =====================================================

CREATE TABLE maintenance_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    maintenance_date DATE NOT NULL,
    description TEXT NOT NULL,

    condition_before ENUM(
        'good',
        'minor_damage',
        'major_damage',
        'removed',
        'replaced'
    ) NOT NULL DEFAULT 'good',

    condition_after ENUM(
        'good',
        'minor_damage',
        'major_damage',
        'removed',
        'replaced'
    ) NOT NULL DEFAULT 'good',

    inventory_asset_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_maintenance_asset
        FOREIGN KEY (inventory_asset_id)
        REFERENCES inventory_assets(id),

    CONSTRAINT fk_maintenance_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);

-- =====================================================
-- BHP STOCK LOG
-- =====================================================

CREATE TABLE bhp_stock_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    status ENUM('in', 'out') NOT NULL,
    total INT NOT NULL DEFAULT 1,

    description TEXT NOT NULL,

    user_id INT UNSIGNED NOT NULL,
    bhp_stock_id INT UNSIGNED NOT NULL,

    maintenance_log_id INT UNSIGNED DEFAULT NULL,

    CONSTRAINT fk_stocklog_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_stocklog_bhp
        FOREIGN KEY (bhp_stock_id)
        REFERENCES bhp_stocks(id),

    CONSTRAINT fk_stocklog_maintenance
        FOREIGN KEY (maintenance_log_id)
        REFERENCES maintenance_logs(id)
);

-- =====================================================
-- MAINTENANCE BHP USAGE
-- =====================================================

CREATE TABLE maintenance_bhp_usage (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    total_used INT NOT NULL DEFAULT 1,

    maintenance_log_id INT UNSIGNED NOT NULL,
    bhp_stock_id INT UNSIGNED NOT NULL,

    CONSTRAINT fk_usage_log
        FOREIGN KEY (maintenance_log_id)
        REFERENCES maintenance_logs(id),

    CONSTRAINT fk_usage_bhp
        FOREIGN KEY (bhp_stock_id)
        REFERENCES bhp_stocks(id)
);

-- =====================================================
-- RECEIPTS
-- =====================================================

CREATE TABLE receipts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    receipt_date DATE NOT NULL,
    total_received INT NOT NULL,

    description TEXT DEFAULT NULL,

    procurement_item_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_receipt_procurement
        FOREIGN KEY (procurement_item_id)
        REFERENCES procurement_items(id),

    CONSTRAINT fk_receipt_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);