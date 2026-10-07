-- =====================================================================
-- 00_database.sql — schema bootstrap
-- Import first. Creates the hr_onboarding schema (utf8mb4).
-- phpMyAdmin: Import > choose this file > Go.
-- Requires: MySQL 5.7+ / MariaDB 10.2+ (JSON columns).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS hr_onboarding
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hr_onboarding;
