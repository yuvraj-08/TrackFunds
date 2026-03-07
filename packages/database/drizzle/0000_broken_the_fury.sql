CREATE TYPE "public"."transaction_source" AS ENUM('MANUAL', 'SMS_IMPORT');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('DEPOSIT', 'WITHDRAWAL');--> statement-breakpoint
CREATE TABLE "account_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"can_view" boolean DEFAULT true NOT NULL,
	"can_add_transactions" boolean DEFAULT false NOT NULL,
	"can_edit_transactions" boolean DEFAULT false NOT NULL,
	"can_delete_transactions" boolean DEFAULT false NOT NULL,
	"can_manage_participants" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"institution" text,
	"currency_code" text DEFAULT 'INR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"source" "transaction_source" DEFAULT 'MANUAL' NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"spent_by_user_id" uuid NOT NULL,
	"recorded_by_user_id" uuid NOT NULL,
	"note" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_participants" ADD CONSTRAINT "account_participants_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_participants" ADD CONSTRAINT "account_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_spent_by_user_id_users_id_fk" FOREIGN KEY ("spent_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_participants_account_user_unique" ON "account_participants" USING btree ("account_id","user_id");--> statement-breakpoint
CREATE INDEX "transactions_account_occurred_at_idx" ON "transactions" USING btree ("account_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transactions_owner_user_idx" ON "transactions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "transactions_spent_by_user_idx" ON "transactions" USING btree ("spent_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");