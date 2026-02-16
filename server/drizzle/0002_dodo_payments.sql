UPDATE `payments` SET `status` = 'pending' WHERE `status` IS NULL;

ALTER TABLE `payments`
  MODIFY COLUMN `status` ENUM('pending','processing','success','failed','cancelled') NOT NULL DEFAULT 'pending';

ALTER TABLE `payments`
  ADD COLUMN `dodo_order_id` varchar(100) NULL,
  ADD COLUMN `dodo_payment_id` varchar(100) NULL,
  ADD COLUMN `enrollment_created` boolean NOT NULL DEFAULT false,
  ADD COLUMN `enrollment_retry_count` int NOT NULL DEFAULT 0,
  ADD COLUMN `next_enrollment_retry_at` timestamp NULL,
  ADD COLUMN `last_enrollment_error` text NULL,
  ADD COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `payments`
  ADD UNIQUE KEY `payments_dodo_payment_id_unique` (`dodo_payment_id`),
  ADD KEY `payments_dodo_order_id_idx` (`dodo_order_id`),
  ADD KEY `payments_status_enrollment_created_idx` (`status`, `enrollment_created`, `next_enrollment_retry_at`);
