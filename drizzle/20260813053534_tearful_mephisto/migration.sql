PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_band_availability` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`bandId` integer NOT NULL,
	`liveId` integer NOT NULL,
	`liveDayId` integer NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	CONSTRAINT `fk_band_availability_bandId_band_id_fk` FOREIGN KEY (`bandId`) REFERENCES `band`(`id`),
	CONSTRAINT `fk_band_availability_liveId_live_id_fk` FOREIGN KEY (`liveId`) REFERENCES `live`(`id`),
	CONSTRAINT `fk_band_availability_liveDayId_live_day_id_fk` FOREIGN KEY (`liveDayId`) REFERENCES `live_day`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_band_availability`(`id`, `bandId`, `liveId`, `liveDayId`, `start`, `end`) SELECT `id`, `bandId`, `liveId`, `liveDayId`, `start`, `end` FROM `band_availability`;--> statement-breakpoint
DROP TABLE `band_availability`;--> statement-breakpoint
ALTER TABLE `__new_band_availability` RENAME TO `band_availability`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_band` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`leaderId` integer NOT NULL,
	CONSTRAINT `fk_band_leaderId_user_id_fk` FOREIGN KEY (`leaderId`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_band`(`id`, `name`, `leaderId`) SELECT `id`, `name`, `leaderId` FROM `band`;--> statement-breakpoint
DROP TABLE `band`;--> statement-breakpoint
ALTER TABLE `__new_band` RENAME TO `band`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_live` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`ownerId` integer NOT NULL,
	CONSTRAINT `fk_live_ownerId_user_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_live`(`id`, `name`, `description`, `ownerId`) SELECT `id`, `name`, `description`, `ownerId` FROM `live`;--> statement-breakpoint
DROP TABLE `live`;--> statement-breakpoint
ALTER TABLE `__new_live` RENAME TO `live`;--> statement-breakpoint
PRAGMA foreign_keys=ON;