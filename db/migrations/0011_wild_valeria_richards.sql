PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`admin_user` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`cutoff_in_minutes` integer DEFAULT 180 NOT NULL,
	`icon_name` text DEFAULT 'lucide:users' NOT NULL,
	`championship_tips_reval_date` integer,
	FOREIGN KEY (`admin_user`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_groups`("id", "name", "admin_user", "created_at", "cutoff_in_minutes", "icon_name", "championship_tips_reval_date") SELECT "id", "name", "admin_user", "created_at", "cutoff_in_minutes", "icon_name", "championship_tips_reval_date" FROM `groups`;--> statement-breakpoint
DROP TABLE `groups`;--> statement-breakpoint
ALTER TABLE `__new_groups` RENAME TO `groups`;--> statement-breakpoint
PRAGMA foreign_keys=ON;