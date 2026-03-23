-- Baseline schema aligned with server/src/db/schema.js (replaces legacy incremental
-- migrations that were never listed in meta/_journal.json, so fresh DBs skipped table creation).

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `name` varchar(100),
  `email` varchar(150) NOT NULL,
  `password_hash` text NOT NULL,
  `role` enum('learner','instructor','admin'),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `courses` (
  `id` char(36) NOT NULL,
  `instructor_id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `price` decimal(10,2) DEFAULT '0.00',
  `is_free` tinyint(1) DEFAULT 1,
  `is_published` tinyint(1) DEFAULT 0,
  `dodo_product_id` varchar(255),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL,
  PRIMARY KEY (`id`),
  KEY `courses_instructor_id_idx` (`instructor_id`),
  CONSTRAINT `courses_instructor_id_users_id_fk` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `sections` (
  `id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `title` varchar(200),
  `order_no` int,
  PRIMARY KEY (`id`),
  KEY `sections_course_id_idx` (`course_id`),
  CONSTRAINT `sections_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `content` (
  `id` char(36) NOT NULL,
  `section_id` char(36) NOT NULL,
  `type` enum('video','pdf','assignment'),
  `title` varchar(200),
  `content_url` text,
  `order_no` int,
  PRIMARY KEY (`id`),
  KEY `content_section_id_idx` (`section_id`),
  CONSTRAINT `content_section_id_sections_id_fk` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `quizzes` (
  `id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `generated_by` enum('llm'),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quizzes_course_id_idx` (`course_id`),
  CONSTRAINT `quizzes_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
  `id` char(36) NOT NULL,
  `quiz_id` char(36) NOT NULL,
  `question` text,
  `options` text,
  `answer` text,
  PRIMARY KEY (`id`),
  KEY `quiz_questions_quiz_id_idx` (`quiz_id`),
  CONSTRAINT `quiz_questions_quiz_id_quizzes_id_fk` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `ai_quiz_cache` (
  `id` char(36) NOT NULL,
  `cache_key` varchar(128) NOT NULL,
  `lesson_text` text,
  `num_questions` int NOT NULL,
  `quiz_json` text NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ai_quiz_cache_cache_key_unique` (`cache_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `lessons` (
  `id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `youtube_video_id` varchar(20),
  `order_index` int NOT NULL DEFAULT 0,
  `content_text` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lessons_course_id_idx` (`course_id`),
  CONSTRAINT `lessons_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `enrollments` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','completed') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollments_user_course_unique` (`user_id`, `course_id`),
  KEY `enrollments_user_id_idx` (`user_id`),
  KEY `enrollments_course_id_idx` (`course_id`),
  CONSTRAINT `enrollments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `enrollments_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `amount` decimal(10,2),
  `provider` varchar(50),
  `dodo_order_id` varchar(100),
  `dodo_payment_id` varchar(100),
  `status` enum('pending','processing','success','failed','cancelled') NOT NULL DEFAULT 'pending',
  `enrollment_created` tinyint(1) NOT NULL DEFAULT 0,
  `enrollment_retry_count` int NOT NULL DEFAULT 0,
  `next_enrollment_retry_at` timestamp NULL,
  `last_enrollment_error` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_dodo_payment_id_unique` (`dodo_payment_id`),
  KEY `payments_user_id_idx` (`user_id`),
  KEY `payments_course_id_idx` (`course_id`),
  KEY `payments_dodo_order_id_idx` (`dodo_order_id`),
  KEY `payments_status_enrollment_created_idx` (`status`, `enrollment_created`, `next_enrollment_retry_at`),
  CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `payments_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
  `user_id` char(36) NOT NULL,
  `lesson_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `progress_pct` int DEFAULT 0,
  `completed` tinyint(1) DEFAULT 0,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `lesson_id`),
  KEY `lesson_progress_lesson_id_idx` (`lesson_id`),
  KEY `lesson_progress_course_id_idx` (`course_id`),
  CONSTRAINT `lesson_progress_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `lesson_progress_lesson_id_lessons_id_fk` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `lesson_progress_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `cart_items` (
  `user_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `added_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `course_id`),
  KEY `cart_items_course_id_idx` (`course_id`),
  CONSTRAINT `cart_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `cart_items_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `resources` (
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
  CONSTRAINT `resources_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `resources_uploader_id_users_id_fk` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `certificates` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `certificate_url` text NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(150) NOT NULL,
  `file_size` int NOT NULL,
  `s3_key` varchar(512) NOT NULL,
  `s3_bucket` varchar(255) NOT NULL,
  `issued_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificates_user_course_unique` (`user_id`, `course_id`),
  UNIQUE KEY `certificates_s3_key_unique` (`s3_key`),
  KEY `certificates_user_id_idx` (`user_id`),
  KEY `certificates_course_id_idx` (`course_id`),
  CONSTRAINT `certificates_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `certificates_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint
CREATE TABLE `sessions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `refresh_token` varchar(500) NOT NULL,
  `user_agent` text,
  `ip_address` varchar(45),
  `is_revoked` tinyint(1) DEFAULT 0,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` timestamp NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_refresh_token_unique` (`refresh_token`),
  KEY `sessions_user_id_idx` (`user_id`),
  CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
