DROP INDEX IF EXISTS "prediction_entries_prediction_id_position_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "predictions_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "predictions_group_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "predictions_is_for_championship_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "predictions_race_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "account_userId_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "session_token_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "session_userId_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "user_email_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE `account` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer));--> statement-breakpoint
CREATE UNIQUE INDEX `prediction_entries_prediction_id_position_unique` ON `prediction_entries` (`prediction_id`,`position`);--> statement-breakpoint
CREATE INDEX `predictions_user_id_idx` ON `predictions` (`user_id`);--> statement-breakpoint
CREATE INDEX `predictions_group_id_idx` ON `predictions` (`group_id`);--> statement-breakpoint
CREATE INDEX `predictions_is_for_championship_idx` ON `predictions` (`is_for_championship`);--> statement-breakpoint
CREATE INDEX `predictions_race_id_idx` ON `predictions` (`race_id`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `session` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer));--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "email_verified" TO "email_verified" integer NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer));--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer));--> statement-breakpoint
ALTER TABLE `verification` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer));--> statement-breakpoint
ALTER TABLE `verification` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer));
