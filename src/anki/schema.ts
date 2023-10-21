import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { InferModel } from 'drizzle-orm'
import { z } from 'zod'

export enum AnkiCardType {
	New = 0,
	Learning,
	Review,
	Relearning
}

export const ankiCards = sqliteTable('cards', {
	id: integer('id').primaryKey(),
	nid: integer('nid').notNull(),
	did: integer('did').notNull(),
	ord: integer('ord').notNull(),
	mod: integer('mod').notNull(),
	usn: integer('usn').notNull(),
	type: integer('type').$type<AnkiCardType>().notNull(),
	queue: integer('queue').notNull(),
	due: integer('due').notNull(),
	ivl: integer('ivl').notNull(),
	factor: integer('factor').notNull(),
	reps: integer('reps').notNull(),
	lapses: integer('lapses').notNull(),
	left: integer('left').notNull(),
	odue: integer('odue').notNull(),
	odid: integer('odid').notNull(),
	flags: integer('flags').notNull(),
	data: text('data').notNull()
})
export type AnkiCard = InferModel<typeof ankiCards>

export const ankiNotes = sqliteTable('notes', {
	id: integer('id').primaryKey(),
	guid: text('guid').notNull(),
	mid: integer('mid').notNull(),
	mod: integer('mod').notNull(),
	usn: integer('usn').notNull(),
	tags: text('tags').notNull(),
	flds: text('flds').notNull(),
	sfld: text('sfld').notNull(),
	csum: integer('csum').notNull(),
	flags: integer('flags').notNull(),
	data: text('data').notNull()
})
export type AnkiNote = InferModel<typeof ankiNotes>

export const ankiCollections = sqliteTable('col', {
	id: integer('id').primaryKey(),
	crt: integer('crt').notNull(),
	mod: integer('mod').notNull(),
	scm: integer('scm').notNull(),
	ver: integer('ver').notNull(),
	dty: integer('dty').notNull(),
	usn: integer('usn').notNull(),
	ls: integer('ls').notNull(),
	conf: text('conf').notNull(),
	models: text('models').notNull(),
	decks: text('decks').notNull(),
	dconf: text('dconf').notNull(),
	tags: text('tags').notNull()
})
export type AnkiCollection = InferModel<typeof ankiCollections>

export const ankiDeck = z.object({
	id: z.number(),
	mod: z.number(),
	name: z.string(),
	usn: z.number(),
	lrnToday: z.tuple([ z.number(), z.number() ]),
	revToday: z.tuple([ z.number(), z.number() ]),
	newToday: z.tuple([ z.number(), z.number() ]),
	timeToday: z.tuple([ z.number(), z.number() ]),
	collapsed: z.boolean(),
	browserCollapsed: z.boolean(),
	desc: z.string(),
	dyn: z.number(),
	conf: z.number(),
	extendNew: z.number(),
	extendRev: z.number()
})