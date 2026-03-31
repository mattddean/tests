CREATE TABLE "test_taker_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"accepted_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_sent_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "test_taker_invite" ADD CONSTRAINT "test_taker_invite_test_id_test_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."test"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_taker_invite" ADD CONSTRAINT "test_taker_invite_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_taker_invite" ADD CONSTRAINT "test_taker_invite_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "test_taker_invite_token_hash_uidx" ON "test_taker_invite" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "test_taker_invite_test_id_email_uidx" ON "test_taker_invite" USING btree ("test_id","email");--> statement-breakpoint
CREATE INDEX "test_taker_invite_test_id_idx" ON "test_taker_invite" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "test_taker_invite_email_idx" ON "test_taker_invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "test_taker_invite_accepted_by_user_id_idx" ON "test_taker_invite" USING btree ("accepted_by_user_id");