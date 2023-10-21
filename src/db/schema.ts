import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { InferModel } from 'drizzle-orm'

export const cards = sqliteTable('cards', {
	id: integer('id').primaryKey(),
	front: text('front').notNull(),
	back: text('back').notNull(),
	repetition: integer('repetition').notNull().default(0),
	intervalMs: integer('intervalMs').notNull().default(0),
	ease: real('ease').notNull().default(2.5),
	due: integer('due', { mode: 'timestamp_ms' }).notNull()
})
export type Card = InferModel<typeof cards>