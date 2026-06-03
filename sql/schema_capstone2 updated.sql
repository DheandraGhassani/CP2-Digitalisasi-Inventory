-- =============================================================
-- Database : db_laboratorium_inventaris
-- Project  : Capstone 2 — Digitalisasi Aset & BHP Laboratorium
-- =============================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS `db_laboratorium_inventaris`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE `db_laboratorium_inventaris`;

-- -------------------------------------------------------------
-- Table: roles
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id`        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `role_name` VARCHAR(45)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name_UNIQUE` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: users
-- role ditentukan via roles_id FK (ENUM dihapus — satu sumber kebenaran)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)  NOT NULL,
  `email`         VARCHAR(100)  NOT NULL,
  `password`      VARCHAR(255)  NOT NULL,
  `profile_photo` VARCHAR(255)  NULL,
  `is_active`     TINYINT       NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `roles_id`      INT UNSIGNED  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  KEY `fk_users_roles1_idx` (`roles_id`),
  CONSTRAINT `fk_users_roles1`
    FOREIGN KEY (`roles_id`) REFERENCES `roles` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: rooms
-- created_by & updated_by di-FK ke users
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rooms` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `room_code`   VARCHAR(20)   NOT NULL,
  `room_name`   VARCHAR(100)  NOT NULL,
  `capacity`    INT UNSIGNED  NULL,
  `description` TEXT          NULL,
  `created_by`  INT UNSIGNED  NOT NULL,
  `updated_by`  INT UNSIGNED  NOT NULL,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_code_UNIQUE` (`room_code`),
  KEY `fk_rooms_created_by_idx` (`created_by`),
  KEY `fk_rooms_updated_by_idx` (`updated_by`),
  CONSTRAINT `fk_rooms_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_rooms_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: bhp_stocks
-- Stok master BHP per ruangan
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bhp_stocks` (
  `id`            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `product_name`  VARCHAR(150)   NOT NULL,
  `unit`          VARCHAR(50)    NOT NULL,
  `current_stock` INT            NOT NULL DEFAULT 0,
  `minimum_stock` INT            NOT NULL DEFAULT 0,
  `unit_price`    DECIMAL(15,2)  NULL,
  `created_at`    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `rooms_id`      INT UNSIGNED   NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_bhp_stocks_rooms1_idx` (`rooms_id`),
  CONSTRAINT `fk_bhp_stocks_rooms1`
    FOREIGN KEY (`rooms_id`) REFERENCES `rooms` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: procurement_drafts
-- Dibuat kalab, di-review kaprodi, di-finalisasi kaprodi
-- status: draft → locked → reviewed → finalized
-- reviewed_by: kaprodi yang melakukan review & finalisasi
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `procurement_drafts` (
  `id`          INT UNSIGNED                                          NOT NULL AUTO_INCREMENT,
  `year`        YEAR                                                  NOT NULL,
  `status`      ENUM('draft','locked','reviewed','finalized')         NOT NULL DEFAULT 'draft',
  `reviewed_by` INT UNSIGNED                                          NULL,
  `created_at`  TIMESTAMP                                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP                                             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `users_id`    INT UNSIGNED                                          NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_procurement_drafts_users1_idx` (`users_id`),
  KEY `fk_procurement_drafts_reviewed_by_idx` (`reviewed_by`),
  CONSTRAINT `fk_procurement_drafts_users1`
    FOREIGN KEY (`users_id`) REFERENCES `users` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_procurement_drafts_reviewed_by`
    FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: procurement_items
-- Tiap item di draf pengadaan.
-- approval_status: kaprodi approve/reject per item (bukan seluruh draf)
-- bhp_stocks_id: NULL jika inventaris, diisi jika BHP (link ke stok yang diisi)
-- replaces_asset_id: NULL jika bukan pengganti, diisi jika mengganti aset lama
--   (FK ke inventory_assets ditambah via ALTER setelah tabel inventory_assets dibuat)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `procurement_items` (
  `id`                    INT UNSIGNED                        NOT NULL AUTO_INCREMENT,
  `product_type`          ENUM('inventaris','bhp')            NOT NULL,
  `product_name`          VARCHAR(150)                        NOT NULL,
  `price`                 DECIMAL(15,2)                       NOT NULL,
  `quantity`              INT                                 NOT NULL DEFAULT 1,
  `purchase_link`         TEXT                                NULL,
  `approval_status`       ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `bhp_stocks_id`         INT UNSIGNED                        NULL,
  `procurement_drafts_id` INT UNSIGNED                        NOT NULL,
  `created_at`            TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_procurement_items_drafts_idx` (`procurement_drafts_id`),
  KEY `fk_procurement_items_bhp_stocks_idx` (`bhp_stocks_id`),
  CONSTRAINT `fk_procurement_items_procurement_drafts1`
    FOREIGN KEY (`procurement_drafts_id`) REFERENCES `procurement_drafts` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_procurement_items_bhp_stocks1`
    FOREIGN KEY (`bhp_stocks_id`) REFERENCES `bhp_stocks` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: inventory_assets
-- Dibuat staf_admin setelah barang diterima.
-- label_code & qr_code_path diisi staf_admin.
-- procurement_items_id: item pengadaan yang menghasilkan aset ini.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory_assets` (
  `id`                   INT UNSIGNED                                                    NOT NULL AUTO_INCREMENT,
  `product_name`         VARCHAR(150)                                                    NOT NULL,
  `label_code`           VARCHAR(50)                                                     NOT NULL,
  `qr_code_path`         VARCHAR(255)                                                    NULL,
  `condition`            ENUM('good','minor_damage','major_damage','removed','replaced') NOT NULL DEFAULT 'good',
  `date_acquired`        DATE                                                            NULL,
  `price`                DECIMAL(15,2)                                                   NULL,
  `created_at`           TIMESTAMP                                                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP                                                       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `procurement_items_id` INT UNSIGNED                                                    NOT NULL,
  `rooms_id`             INT UNSIGNED                                                    NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label_code_UNIQUE` (`label_code`),
  KEY `fk_inventory_assets_procurement_items1_idx` (`procurement_items_id`),
  KEY `fk_inventory_assets_rooms1_idx` (`rooms_id`),
  CONSTRAINT `fk_inventory_assets_procurement_items1`
    FOREIGN KEY (`procurement_items_id`) REFERENCES `procurement_items` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_inventory_assets_rooms1`
    FOREIGN KEY (`rooms_id`) REFERENCES `rooms` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- ALTER: tambah replaces_asset_id ke procurement_items
-- Harus setelah inventory_assets dibuat (circular FK antar 2 tabel)
-- -------------------------------------------------------------
ALTER TABLE `procurement_items`
  ADD COLUMN `replaces_asset_id` INT UNSIGNED NULL AFTER `bhp_stocks_id`,
  ADD KEY `fk_procurement_items_replaces_asset_idx` (`replaces_asset_id`),
  ADD CONSTRAINT `fk_procurement_items_replaces_asset`
    FOREIGN KEY (`replaces_asset_id`) REFERENCES `inventory_assets` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- -------------------------------------------------------------
-- Table: receipt
-- Log penerimaan barang (bisa bertahap, tidak sekaligus).
-- users_id: staf_admin yang menginput penerimaan.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `receipt` (
  `id`                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `receipt_date`         DATE          NOT NULL,
  `total_received`       INT           NOT NULL,
  `description`          TEXT          NULL,
  `created_at`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `procurement_items_id` INT UNSIGNED  NOT NULL,
  `users_id`             INT UNSIGNED  NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_receipt_procurement_items1_idx` (`procurement_items_id`),
  KEY `fk_receipt_users1_idx` (`users_id`),
  CONSTRAINT `fk_receipt_procurement_items1`
    FOREIGN KEY (`procurement_items_id`) REFERENCES `procurement_items` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_receipt_users1`
    FOREIGN KEY (`users_id`) REFERENCES `users` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: maintenance_logs
-- users_id: staf_lab yang melakukan maintenance.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `maintenance_logs` (
  `id`                  INT UNSIGNED                                                    NOT NULL AUTO_INCREMENT,
  `maintenance_date`    DATE                                                            NOT NULL,
  `description`         TEXT                                                            NOT NULL,
  `condition_before`    ENUM('good','minor_damage','major_damage','removed','replaced') NOT NULL DEFAULT 'good',
  `condition_after`     ENUM('good','minor_damage','major_damage','removed','replaced') NOT NULL DEFAULT 'good',
  `created_at`          TIMESTAMP                                                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `inventory_assets_id` INT UNSIGNED                                                    NOT NULL,
  `users_id`            INT UNSIGNED                                                    NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_maintenance_logs_inventory_assets1_idx` (`inventory_assets_id`),
  KEY `fk_maintenance_logs_users1_idx` (`users_id`),
  CONSTRAINT `fk_maintenance_logs_inventory_assets1`
    FOREIGN KEY (`inventory_assets_id`) REFERENCES `inventory_assets` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_maintenance_logs_users1`
    FOREIGN KEY (`users_id`) REFERENCES `users` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: maintenance_bhp_usage
-- BHP yang dipakai saat maintenance. Pemicu pengurangan bhp_stocks.current_stock.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `maintenance_bhp_usage` (
  `id`                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `total_used`          INT           NOT NULL DEFAULT 1,
  `maintenance_logs_id` INT UNSIGNED  NOT NULL,
  `bhp_stocks_id`       INT UNSIGNED  NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_maintenance_bhp_usage_logs1_idx` (`maintenance_logs_id`),
  KEY `fk_maintenance_bhp_usage_bhp_stocks1_idx` (`bhp_stocks_id`),
  CONSTRAINT `fk_maintenance_bhp_usage_maintenance_logs1`
    FOREIGN KEY (`maintenance_logs_id`) REFERENCES `maintenance_logs` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_maintenance_bhp_usage_bhp_stocks1`
    FOREIGN KEY (`bhp_stocks_id`) REFERENCES `bhp_stocks` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: bhp_stock_log
-- Audit trail semua pergerakan stok BHP (masuk & keluar).
-- maintenance_logs_id: NULL jika stock-IN dari penerimaan pengadaan,
--                      diisi jika stock-OUT dari maintenance.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bhp_stock_log` (
  `id`                  INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  `status`              ENUM('in','out')    NOT NULL,
  `total`               INT                 NOT NULL DEFAULT 1,
  `description`         TEXT                NOT NULL,
  `users_id`            INT UNSIGNED        NOT NULL,
  `bhp_stocks_id`       INT UNSIGNED        NOT NULL,
  `maintenance_logs_id` INT UNSIGNED        NULL,
  PRIMARY KEY (`id`),
  KEY `fk_bhp_stock_log_users1_idx` (`users_id`),
  KEY `fk_bhp_stock_log_bhp_stocks1_idx` (`bhp_stocks_id`),
  KEY `fk_bhp_stock_log_maintenance_logs1_idx` (`maintenance_logs_id`),
  CONSTRAINT `fk_bhp_stock_log_users1`
    FOREIGN KEY (`users_id`) REFERENCES `users` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_bhp_stock_log_bhp_stocks1`
    FOREIGN KEY (`bhp_stocks_id`) REFERENCES `bhp_stocks` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_bhp_stock_log_maintenance_logs1`
    FOREIGN KEY (`maintenance_logs_id`) REFERENCES `maintenance_logs` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Seed: roles (nilai default)
-- -------------------------------------------------------------
INSERT IGNORE INTO `roles` (`role_name`) VALUES
  ('admin'),
  ('kalab'),
  ('kaprodi'),
  ('staff_admin'),
  ('staff_lab');

-- -------------------------------------------------------------
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
