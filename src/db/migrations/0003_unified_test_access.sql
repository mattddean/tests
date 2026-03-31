CREATE TABLE "test_user" (
	"test_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"granted_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_user_pk" PRIMARY KEY("test_id","user_id")
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
ALTER TABLE "test_user" ADD CONSTRAINT "test_user_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_user" ADD CONSTRAINT "test_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_user" ADD CONSTRAINT "test_user_granted_by_user_id_user_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_email_access" ADD CONSTRAINT "test_email_access_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_email_access" ADD CONSTRAINT "test_email_access_granted_by_user_id_user_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "test_user_test_id_idx" ON "test_user" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_user_user_id_idx" ON "test_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_user_role_idx" ON "test_user" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "test_email_access_test_id_email_role_uidx" ON "test_email_access" USING btree ("test_id","email","role");--> statement-breakpoint
CREATE INDEX "test_email_access_test_id_idx" ON "test_email_access" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_email_access_email_idx" ON "test_email_access" USING btree ("email");--> statement-breakpoint
CREATE INDEX "test_email_access_role_idx" ON "test_email_access" USING btree ("role");--> statement-breakpoint
ALTER TABLE "test" DROP COLUMN "owner_user_id";--> statement-breakpoint
DROP TABLE "test_editor" CASCADE;--> statement-breakpoint
DROP TABLE "test_taker_invite" CASCADE;
