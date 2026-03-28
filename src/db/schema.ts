import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const test = pgTable(
  "test",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("draft"),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("test_slug_uidx").on(table.slug),
    index("test_owner_user_id_idx").on(table.ownerUserId),
    index("test_status_published_at_idx").on(table.status, table.publishedAt),
  ],
);

export const testEditor = pgTable(
  "test_editor",
  {
    testId: text("test_id")
      .notNull()
      .references(() => test.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.testId, table.userId], name: "test_editor_pk" }),
    index("test_editor_test_id_idx").on(table.testId),
    index("test_editor_user_id_idx").on(table.userId),
  ],
);

export const testQuestion = pgTable(
  "test_question",
  {
    id: text("id").primaryKey(),
    testId: text("test_id")
      .notNull()
      .references(() => test.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    description: text("description"),
    required: boolean("required").notNull().default(true),
    type: text("type").notNull().default("multiple_choice"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("test_question_test_id_idx").on(table.testId),
    uniqueIndex("test_question_test_id_position_uidx").on(table.testId, table.position),
  ],
);

export const questionChoice = pgTable(
  "question_choice",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => testQuestion.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("question_choice_question_id_idx").on(table.questionId),
    uniqueIndex("question_choice_question_id_position_uidx").on(table.questionId, table.position),
  ],
);

export const testResponse = pgTable(
  "test_response",
  {
    id: text("id").primaryKey(),
    testId: text("test_id")
      .notNull()
      .references(() => test.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("draft"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    submittedAt: timestamp("submitted_at"),
    lastAutosavedAt: timestamp("last_autosaved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("test_response_test_id_idx").on(table.testId),
    index("test_response_user_id_idx").on(table.userId),
    index("test_response_test_id_status_idx").on(table.testId, table.status),
    uniqueIndex("test_response_test_id_user_id_uidx").on(table.testId, table.userId),
  ],
);

export const responseAnswer = pgTable(
  "response_answer",
  {
    id: text("id").primaryKey(),
    responseId: text("response_id")
      .notNull()
      .references(() => testResponse.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => testQuestion.id, { onDelete: "cascade" }),
    choiceId: text("choice_id")
      .notNull()
      .references(() => questionChoice.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("response_answer_response_id_idx").on(table.responseId),
    index("response_answer_question_id_idx").on(table.questionId),
    uniqueIndex("response_answer_response_id_question_id_uidx").on(
      table.responseId,
      table.questionId,
    ),
  ],
);

export * from "./auth-schema";

export const testRelations = relations(test, ({ one, many }) => ({
  owner: one(user, {
    fields: [test.ownerUserId],
    references: [user.id],
  }),
  editors: many(testEditor),
  questions: many(testQuestion),
  responses: many(testResponse),
}));

export const testEditorRelations = relations(testEditor, ({ one }) => ({
  test: one(test, {
    fields: [testEditor.testId],
    references: [test.id],
  }),
  user: one(user, {
    fields: [testEditor.userId],
    references: [user.id],
  }),
  invitedBy: one(user, {
    fields: [testEditor.invitedByUserId],
    references: [user.id],
  }),
}));

export const testQuestionRelations = relations(testQuestion, ({ one, many }) => ({
  test: one(test, {
    fields: [testQuestion.testId],
    references: [test.id],
  }),
  choices: many(questionChoice),
  answers: many(responseAnswer),
}));

export const questionChoiceRelations = relations(questionChoice, ({ one, many }) => ({
  question: one(testQuestion, {
    fields: [questionChoice.questionId],
    references: [testQuestion.id],
  }),
  answers: many(responseAnswer),
}));

export const testResponseRelations = relations(testResponse, ({ one, many }) => ({
  test: one(test, {
    fields: [testResponse.testId],
    references: [test.id],
  }),
  user: one(user, {
    fields: [testResponse.userId],
    references: [user.id],
  }),
  answers: many(responseAnswer),
}));

export const responseAnswerRelations = relations(responseAnswer, ({ one }) => ({
  response: one(testResponse, {
    fields: [responseAnswer.responseId],
    references: [testResponse.id],
  }),
  question: one(testQuestion, {
    fields: [responseAnswer.questionId],
    references: [testQuestion.id],
  }),
  choice: one(questionChoice, {
    fields: [responseAnswer.choiceId],
    references: [questionChoice.id],
  }),
}));

export const userTestRelations = relations(user, ({ many }) => ({
  ownedTests: many(test),
  editableTests: many(testEditor),
  responses: many(testResponse),
}));

export const nowExpression = sql`now()`;
