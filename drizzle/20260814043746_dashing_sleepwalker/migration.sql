PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_band_participation` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`liveId` integer NOT NULL,
	`bandId` integer NOT NULL,
	`approved` integer NOT NULL,
	CONSTRAINT `fk_band_application_liveId_live_id_fk` FOREIGN KEY (`liveId`) REFERENCES `live`(`id`),
	CONSTRAINT `fk_band_application_bandId_band_id_fk` FOREIGN KEY (`bandId`) REFERENCES `band`(`id`),
	CONSTRAINT `band_participation_liveId_bandId_unique` UNIQUE(`liveId`,`bandId`)
);
--> statement-breakpoint
INSERT INTO `__new_band_participation`(`id`, `liveId`, `bandId`, `approved`) SELECT `id`, `liveId`, `bandId`, `approved` FROM `band_participation`;--> statement-breakpoint
DROP TABLE `band_participation`;--> statement-breakpoint
ALTER TABLE `__new_band_participation` RENAME TO `band_participation`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_live_day` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`liveId` integer NOT NULL,
	`date` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	CONSTRAINT `fk_live_day_liveId_live_id_fk` FOREIGN KEY (`liveId`) REFERENCES `live`(`id`),
	CONSTRAINT `live_day_id_date_unique` UNIQUE(`id`,`date`)
);
--> statement-breakpoint
INSERT INTO `__new_live_day`(`id`, `liveId`, `date`, `start`, `end`) SELECT `id`, `liveId`, `date`, `start`, `end` FROM `live_day`;--> statement-breakpoint
DROP TABLE `live_day`;--> statement-breakpoint
ALTER TABLE `__new_live_day` RENAME TO `live_day`;--> statement-breakpoint
PRAGMA foreign_keys=ON;