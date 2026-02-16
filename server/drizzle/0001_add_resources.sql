CREATE TABLE IF NOT EXISTS `resources` (
  `id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `uploader_id` char(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(150) NOT NULL,
  `file_size` int NOT NULL,
  `s3_key` varchar(512) NOT NULL,
  `s3_bucket` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `resources_s3_key_unique` (`s3_key`),
  KEY `resources_course_id_idx` (`course_id`),
  KEY `resources_uploader_id_idx` (`uploader_id`),
  CONSTRAINT `resources_course_id_courses_id_fk`
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  CONSTRAINT `resources_uploader_id_users_id_fk`
    FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
