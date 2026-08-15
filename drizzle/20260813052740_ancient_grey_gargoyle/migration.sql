PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_live` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`ownerId` text NOT NULL,
	CONSTRAINT `fk_live_ownerId_user_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_live`(`id`, `name`, `description`, `ownerId`) SELECT `id`, `name`, `description`, `ownerId` FROM `live`;--> statement-breakpoint
DROP TABLE `live`;--> statement-breakpoint
ALTER TABLE `__new_live` RENAME TO `live`;--> statement-breakpoint
PRAGMA foreign_keys=ON;