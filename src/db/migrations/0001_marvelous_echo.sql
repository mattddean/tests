CREATE TABLE "question_choice" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_answer" (
	"id" text PRIMARY KEY NOT NULL,
	"response_id" text NOT NULL,
	"question_id" text NOT NULL,
	"choice_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"owner_user_id" text NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_editor" (
	"test_id" text NOT NULL,
	"user_id" text NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_editor_pk" PRIMARY KEY("test_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "test_question" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"position" integer NOT NULL,
	"prompt" text NOT NULL,
	"description" text,
	"required" boolean DEFAULT true NOT NULL,
	"type" text DEFAULT 'multiple_choice' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_response" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"last_autosaved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "todo" CASCADE;--> statement-breakpoint
ALTER TABLE "question_choice" ADD CONSTRAINT "question_choice_question_id_test_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."test_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answer" ADD CONSTRAINT "response_answer_response_id_test_response_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."test_response"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answer" ADD CONSTRAINT "response_answer_question_id_test_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."test_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answer" ADD CONSTRAINT "response_answer_choice_id_question_choice_id_fk" FOREIGN KEY ("choice_id") REFERENCES "public"."question_choice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test" ADD CONSTRAINT "test_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_editor" ADD CONSTRAINT "test_editor_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_editor" ADD CONSTRAINT "test_editor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_editor" ADD CONSTRAINT "test_editor_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_question" ADD CONSTRAINT "test_question_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_response" ADD CONSTRAINT "test_response_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_response" ADD CONSTRAINT "test_response_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "question_choice_question_id_idx" ON "question_choice" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "question_choice_question_id_position_uidx" ON "question_choice" USING btree ("question_id","position");--> statement-breakpoint
CREATE INDEX "response_answer_response_id_idx" ON "response_answer" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_answer_question_id_idx" ON "response_answer" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "response_answer_response_id_question_id_uidx" ON "response_answer" USING btree ("response_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_slug_uidx" ON "test" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "test_owner_user_id_idx" ON "test" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "test_status_published_at_idx" ON "test" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "test_editor_test_id_idx" ON "test_editor" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_editor_user_id_idx" ON "test_editor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_question_test_id_idx" ON "test_question" USING btree ("test_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_question_test_id_position_uidx" ON "test_question" USING btree ("test_id","position");--> statement-breakpoint
CREATE INDEX "test_response_test_id_idx" ON "test_response" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_response_user_id_idx" ON "test_response" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_response_test_id_status_idx" ON "test_response" USING btree ("test_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "test_response_test_id_user_id_uidx" ON "test_response" USING btree ("test_id","user_id");