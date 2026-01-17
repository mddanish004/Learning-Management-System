import {
  mysqlTable,
  mysqlEnum,
  char,
  varchar,
  text,
  timestamp,
  boolean,
  int,
  decimal,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

const UserRole = mysqlEnum("user_role", ["learner", "instructor"]);
const ContentType = mysqlEnum("content_type", ["video", "pdf", "assignment"]);
const QuizGeneratedBy = mysqlEnum("quiz_generated_by", ["llm"]);
const EnrollmentStatus = mysqlEnum("enrollment_status", ["active", "completed"]);
const PaymentStatus = mysqlEnum("payment_status", ["success", "failed"]);


export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 150 }).notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: UserRole,
  created_at: timestamp("created_at").defaultNow(),
});

export const courses = mysqlTable("courses", {
  id: char("id", { length: 36 }).primaryKey(),
  instructor_id: char("instructor_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  is_published: boolean("is_published").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const sections = mysqlTable("sections", {
  id: char("id", { length: 36 }).primaryKey(),
  course_id: char("course_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 200 }),
  order_no: int("order_no"),
});

export const content = mysqlTable("content", {
  id: char("id", { length: 36 }).primaryKey(),
  section_id: char("section_id", { length: 36 }).notNull(),
  type: ContentType,
  title: varchar("title", { length: 200 }),
  content_url: text("content_url"),
  order_no: int("order_no"),
});

export const quizzes = mysqlTable("quizzes", {
  id: char("id", { length: 36 }).primaryKey(),
  course_id: char("course_id", { length: 36 }).notNull(),
  generated_by: QuizGeneratedBy,
  created_at: timestamp("created_at").defaultNow(),
});

export const quiz_questions = mysqlTable("quiz_questions", {
  id: char("id", { length: 36 }).primaryKey(),
  quiz_id: char("quiz_id", { length: 36 }).notNull(),
  question: text("question"),
  options: text("options"), 
  answer: text("answer"),
});

export const enrollments = mysqlTable("enrollments", {
  id: char("id", { length: 36 }).primaryKey(),
  user_id: char("user_id", { length: 36 }).notNull(),
  course_id: char("course_id", { length: 36 }).notNull(),
  enrolled_at: timestamp("enrolled_at").defaultNow(),
  status: EnrollmentStatus,
});

export const payments = mysqlTable("payments", {
  id: char("id", { length: 36 }).primaryKey(),
  user_id: char("user_id", { length: 36 }).notNull(),
  course_id: char("course_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  provider: varchar("provider", { length: 50 }),
  status: PaymentStatus,
  created_at: timestamp("created_at").defaultNow(),
});

export const lesson_progress = mysqlTable("lesson_progress", {
  user_id: char("user_id", { length: 36 }).notNull(),
  course_id: char("course_id", { length: 36 }).notNull(),
  progress_pct: int("progress_pct").default(0),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pk: ["user_id", "course_id"], 
}));

export const certificates = mysqlTable("certificates", {
  id: char("id", { length: 36 }).primaryKey(),
  user_id: char("user_id", { length: 36 }).notNull(),
  course_id: char("course_id", { length: 36 }).notNull(),
  certificate_url: text("certificate_url"),
  issued_at: timestamp("issued_at").defaultNow(),
});

export const cart_items = mysqlTable("cart_items", {
  user_id: char("user_id", { length: 36 }).notNull(),
  course_id: char("course_id", { length: 36 }).notNull(),
  added_at: timestamp("added_at").defaultNow(),
}, (table) => ({
  pk: ["user_id", "course_id"],
}));

export const sessions = mysqlTable("sessions", {
  id: char("id", { length: 36 }).primaryKey(),
  user_id: char("user_id", { length: 36 }).notNull(),
  refresh_token: varchar("refresh_token", { length: 500 }).notNull().unique(),
  user_agent: text("user_agent"),
  ip_address: varchar("ip_address", { length: 45 }),
  is_revoked: boolean("is_revoked").default(false),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  last_used_at: timestamp("last_used_at"),
});


courses.foreignKeys = {
  instructor: { columns: [courses.instructor_id], references: [users.id] },
};

sections.foreignKeys = {
  course: { columns: [sections.course_id], references: [courses.id] },
};

content.foreignKeys = {
  section: { columns: [content.section_id], references: [sections.id] },
};

quizzes.foreignKeys = {
  course: { columns: [quizzes.course_id], references: [courses.id] },
};

quiz_questions.foreignKeys = {
  quiz: { columns: [quiz_questions.quiz_id], references: [quizzes.id] },
};

enrollments.foreignKeys = {
  user: { columns: [enrollments.user_id], references: [users.id] },
  course: { columns: [enrollments.course_id], references: [courses.id] },
};

payments.foreignKeys = {
  user: { columns: [payments.user_id], references: [users.id] },
  course: { columns: [payments.course_id], references: [courses.id] },
};

lesson_progress.foreignKeys = {
  user: { columns: [lesson_progress.user_id], references: [users.id] },
  course: { columns: [lesson_progress.course_id], references: [courses.id] },
};

certificates.foreignKeys = {
  user: { columns: [certificates.user_id], references: [users.id] },
  course: { columns: [certificates.course_id], references: [courses.id] },
};

cart_items.foreignKeys = {
  user: { columns: [cart_items.user_id], references: [users.id] },
  course: { columns: [cart_items.course_id], references: [courses.id] },
};

sessions.foreignKeys = {
  user: { columns: [sessions.user_id], references: [users.id] },
};


export const usersRelations = relations(users, ({ many, one }) => ({
  courses: many(courses),
  enrollments: many(enrollments),
  payments: many(payments),
  progress: many(lesson_progress),
  certificates: many(certificates),
  cartItems: many(cart_items),
  sessions: many(sessions),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructor_id],
    references: [users.id],
  }),
  sections: many(sections),
  quizzes: many(quizzes),
  enrollments: many(enrollments),
  payments: many(payments),
  progress: many(lesson_progress),
  certificates: many(certificates),
  cartItems: many(cart_items),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  course: one(courses, {
    fields: [sections.course_id],
    references: [courses.id],
  }),
  content: many(content),
}));

export const contentRelations = relations(content, ({ one }) => ({
  section: one(sections, {
    fields: [content.section_id],
    references: [sections.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, {
    fields: [quizzes.course_id],
    references: [courses.id],
  }),
  questions: many(quiz_questions),
}));

export const quizQuestionsRelations = relations(quiz_questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quiz_questions.quiz_id],
    references: [quizzes.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.user_id],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.course_id],
    references: [courses.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.user_id],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [payments.course_id],
    references: [courses.id],
  }),
}));

export const lessonProgressRelations = relations(lesson_progress, ({ one }) => ({
  user: one(users, {
    fields: [lesson_progress.user_id],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [lesson_progress.course_id],
    references: [courses.id],
  }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.user_id],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [certificates.course_id],
    references: [courses.id],
  }),
}));

export const cartItemsRelations = relations(cart_items, ({ one }) => ({
  user: one(users, {
    fields: [cart_items.user_id],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [cart_items.course_id],
    references: [courses.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.user_id],
    references: [users.id],
  }),
}));