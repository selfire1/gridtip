DROP INDEX "prediction_entries_prediction_id_position_unique";--> statement-breakpoint
DROP INDEX "predictions_user_id_idx";--> statement-breakpoint
DROP INDEX "predictions_group_id_idx";--> statement-breakpoint
DROP INDEX "predictions_is_for_championship_idx";--> statement-breakpoint
DROP INDEX "predictions_race_id_idx";--> statement-breakpoint
DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE `drivers` ALTER COLUMN "permanent_number" TO "permanent_number" text;--> statement-breakpoint
CREATE UNIQUE INDEX `group_members_groupId_userId_uq` ON `group_members` (`group_id`,`user_id`);--> statement-breakpoint
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
ALTER TABLE `group_members` ALTER COLUMN "user_name" TO "user_name" text NOT NULL;
