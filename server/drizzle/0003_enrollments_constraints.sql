UPDATE `enrollments` SET `enrollment_status` = 'active' WHERE `enrollment_status` IS NULL;
--> statement-breakpoint
UPDATE `enrollments` SET `enrolled_at` = CURRENT_TIMESTAMP WHERE `enrolled_at` IS NULL;
--> statement-breakpoint
DELETE e1
FROM `enrollments` e1
INNER JOIN `enrollments` e2
  ON e1.`user_id` = e2.`user_id`
 AND e1.`course_id` = e2.`course_id`
 AND (
   COALESCE(e1.`enrolled_at`, '1970-01-01 00:00:00') > COALESCE(e2.`enrolled_at`, '1970-01-01 00:00:00')
   OR (
     COALESCE(e1.`enrolled_at`, '1970-01-01 00:00:00') = COALESCE(e2.`enrolled_at`, '1970-01-01 00:00:00')
     AND e1.`id` > e2.`id`
   )
 );
--> statement-breakpoint
ALTER TABLE `enrollments`
  MODIFY COLUMN `enrolled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `enrollment_status` ENUM('active','completed') NOT NULL DEFAULT 'active',
  ADD UNIQUE KEY `enrollments_user_course_unique` (`user_id`, `course_id`),
  ADD KEY `enrollments_user_id_idx` (`user_id`),
  ADD KEY `enrollments_course_id_idx` (`course_id`);
