CREATE TABLE `band_availability` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`bandId` text NOT NULL,
	`liveId` text NOT NULL,
	`liveDayId` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	CONSTRAINT `fk_band_availability_bandId_band_id_fk` FOREIGN KEY (`bandId`) REFERENCES `band`(`id`),
	CONSTRAINT `fk_band_availability_liveId_live_id_fk` FOREIGN KEY (`liveId`) REFERENCES `live`(`id`),
	CONSTRAINT `fk_band_availability_liveDayId_live_day_id_fk` FOREIGN KEY (`liveDayId`) REFERENCES `live_day`(`id`)
);
--> statement-breakpoint
CREATE TABLE `band` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`leaderId` text NOT NULL,
	CONSTRAINT `fk_band_leaderId_user_id_fk` FOREIGN KEY (`leaderId`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_day` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`liveId` integer NOT NULL,
	`date` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	CONSTRAINT `fk_live_day_liveId_live_id_fk` FOREIGN KEY (`liveId`) REFERENCES `live`(`id`)
);
--> statement-breakpoint
CREATE TABLE `live` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`description` text,
	`ownerId` text,
	CONSTRAINT `fk_live_ownerId_user_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`mail` text NOT NULL UNIQUE,
	`passwordHash` text NOT NULL
);
