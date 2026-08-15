CREATE TABLE `band_application` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`liveId` integer NOT NULL,
	`bandId` integer NOT NULL,
	`approved` integer NOT NULL,
	CONSTRAINT `fk_band_application_liveId_live_id_fk` FOREIGN KEY (`liveId`) REFERENCES `live`(`id`),
	CONSTRAINT `fk_band_application_bandId_band_id_fk` FOREIGN KEY (`bandId`) REFERENCES `band`(`id`)
);
