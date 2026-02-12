ALTER TABLE `posts` ADD `is_public` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `plain_content` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `plain_title` text;--> statement-breakpoint
ALTER TABLE `users` ADD `username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);