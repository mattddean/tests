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
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_email_access" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"granted_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_sent_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "test_user" (
	"test_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"granted_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_user_pk" PRIMARY KEY("test_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question_choice" ADD CONSTRAINT "question_choice_question_id_test_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."test_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answer" ADD CONSTRAINT "response_answer_response_id_test_response_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."test_response"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answer" ADD CONSTRAINT "response_answer_question_id_test_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."test_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answer" ADD CONSTRAINT "response_answer_choice_id_question_choice_id_fk" FOREIGN KEY ("choice_id") REFERENCES "public"."question_choice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_email_access" ADD CONSTRAINT "test_email_access_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_email_access" ADD CONSTRAINT "test_email_access_granted_by_user_id_user_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_question" ADD CONSTRAINT "test_question_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_response" ADD CONSTRAINT "test_response_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_response" ADD CONSTRAINT "test_response_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_user" ADD CONSTRAINT "test_user_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_user" ADD CONSTRAINT "test_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_user" ADD CONSTRAINT "test_user_granted_by_user_id_user_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "question_choice_question_id_idx" ON "question_choice" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "question_choice_question_id_position_uidx" ON "question_choice" USING btree ("question_id","position");--> statement-breakpoint
CREATE INDEX "response_answer_response_id_idx" ON "response_answer" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "response_answer_question_id_idx" ON "response_answer" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "response_answer_response_id_question_id_uidx" ON "response_answer" USING btree ("response_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_slug_uidx" ON "test" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "test_status_published_at_idx" ON "test" USING btree ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "test_email_access_test_id_email_role_uidx" ON "test_email_access" USING btree ("test_id","email","role");--> statement-breakpoint
CREATE INDEX "test_email_access_test_id_idx" ON "test_email_access" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_email_access_email_idx" ON "test_email_access" USING btree ("email");--> statement-breakpoint
CREATE INDEX "test_email_access_role_idx" ON "test_email_access" USING btree ("role");--> statement-breakpoint
CREATE INDEX "test_question_test_id_idx" ON "test_question" USING btree ("test_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_question_test_id_position_uidx" ON "test_question" USING btree ("test_id","position");--> statement-breakpoint
CREATE INDEX "test_response_test_id_idx" ON "test_response" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_response_user_id_idx" ON "test_response" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_response_test_id_status_idx" ON "test_response" USING btree ("test_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "test_response_test_id_user_id_uidx" ON "test_response" USING btree ("test_id","user_id");--> statement-breakpoint
CREATE INDEX "test_user_test_id_idx" ON "test_user" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_user_user_id_idx" ON "test_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_user_role_idx" ON "test_user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");