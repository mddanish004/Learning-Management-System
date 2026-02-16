CREATE TABLE IF NOT EXISTS `certificates` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `certificate_url` text,
  `issued_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
--> statement-breakpoint
ALTER TABLE `certificates`
  ADD COLUMN `file_name` varchar(255) NULL,
  ADD COLUMN `file_type` varchar(150) NULL,
  ADD COLUMN `file_size` int NULL,
  ADD COLUMN `s3_key` varchar(512) NULL,
  ADD COLUMN `s3_bucket` varchar(255) NULL;
--> statement-breakpoint
DELETE c1
FROM `certificates` c1
INNER JOIN `certificates` c2
  ON c1.`user_id` = c2.`user_id`
 AND c1.`course_id` = c2.`course_id`
 AND (
   COALESCE(c1.`issued_at`, '1970-01-01 00:00:00') < COALESCE(c2.`issued_at`, '1970-01-01 00:00:00')
   OR (
     COALESCE(c1.`issued_at`, '1970-01-01 00:00:00') = COALESCE(c2.`issued_at`, '1970-01-01 00:00:00')
     AND c1.`id` < c2.`id`
   )
 );
--> statement-breakpoint
ALTER TABLE `certificates`
  ADD UNIQUE KEY `certificates_user_course_unique` (`user_id`, `course_id`),
  ADD UNIQUE KEY `certificates_s3_key_unique` (`s3_key`),
  ADD KEY `certificates_user_id_idx` (`user_id`),
  ADD KEY `certificates_course_id_idx` (`course_id`);
