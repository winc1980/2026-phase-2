CREATE TABLE `live_application_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`liveId` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`available` integer NOT NULL,
	CONSTRAINT `fk_live_application_table_liveId_live_id_fk` FOREIGN KEY (`liveId`) REFERENCES `live`(`id`)
);
