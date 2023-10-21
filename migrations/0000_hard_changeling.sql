CREATE TABLE `cards` (
	`id` integer PRIMARY KEY NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`repetition` integer DEFAULT 0 NOT NULL,
	`intervalMs` integer DEFAULT 0 NOT NULL,
	`ease` real DEFAULT 2.5 NOT NULL,
	`due` integer NOT NULL
);
