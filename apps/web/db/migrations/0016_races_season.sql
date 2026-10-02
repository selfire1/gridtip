ALTER TABLE `races` ADD `season` integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `races` ADD `circuit_id` text;--> statement-breakpoint
UPDATE `races` SET `season` = CAST(strftime('%Y', `grand_prix_date`, 'unixepoch') AS integer), `circuit_id` = `id`;--> statement-breakpoint
CREATE UNIQUE INDEX `races_season_circuit_id_uq` ON `races` (`season`,`circuit_id`);--> statement-breakpoint
ALTER TABLE `predictions` ADD `season` integer;--> statement-breakpoint
UPDATE `predictions` SET `season` = 2026 WHERE `is_for_championship` = 1;--> statement-breakpoint
DROP INDEX `predictions_member_group_championship_uq`;--> statement-breakpoint
CREATE UNIQUE INDEX `predictions_member_group_championship_uq` ON `predictions` (`member_id`,`group_id`,`season`) WHERE is_for_championship = 1;
