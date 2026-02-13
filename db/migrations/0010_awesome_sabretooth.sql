DROP INDEX `predictions_user_id_idx`;--> statement-breakpoint
ALTER TABLE `predictions` ADD `member_id` text NOT NULL REFERENCES group_members(id);--> statement-breakpoint
CREATE INDEX `predictions_member_id_idx` ON `predictions` (`member_id`);--> statement-breakpoint
ALTER TABLE `predictions` DROP COLUMN `user_id`;