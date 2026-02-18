-- Migration: Add category column to menu_items table
-- Run this in your MySQL database

USE jungapp_db;

ALTER TABLE menu_items ADD COLUMN category VARCHAR(100) AFTER price;

-- Verify the change
DESCRIBE menu_items;
