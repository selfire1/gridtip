ALTER TABLE `predictions` RENAME COLUMN "user_id" TO "member_id";--> statement-breakpoint
DROP INDEX `predictions_user_id_idx`;--> statement-breakpoint
CREATE INDEX `predictions_member_id_idx` ON `predictions` (`member_id`);--> statement-breakpoint
ALTER TABLE `predictions` ALTER COLUMN "member_id" TO "member_id" text NOT NULL REFERENCES group_members(id) ON DELETE cascade ON UPDATE no action;