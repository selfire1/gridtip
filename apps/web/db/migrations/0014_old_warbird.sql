CREATE TABLE `race_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`race_id` text NOT NULL,
	`tip_type` text NOT NULL,
	`reminder_type` text NOT NULL,
	`sent_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`race_id`) REFERENCES `races`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `race_notifications_user_id_idx` ON `race_notifications` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `race_notifications_uq` ON `race_notifications` (`user_id`,`race_id`,`tip_type`,`reminder_type`);--> statement-breakpoint
CREATE TABLE `user_push_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`platform` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_push_tokens_token_unique` ON `user_push_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `user_push_tokens_user_id_idx` ON `user_push_tokens` (`user_id`);--> statement-breakpoint
ALTER TABLE `user` ADD `enable_notifications` integer;