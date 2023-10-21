import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { eq, desc, and } from 'drizzle-orm'
import { z } from 'zod'

import { ankiCards, ankiNotes, AnkiCardType, ankiCollections } from './schema'
import { cards, db } from '../db'

const ivlToMs = (ivl: number): number => {
	if (ivl <= 0) return ivl * 1000
	return ivl * 1000 * 60 * 60 * 24
}

export const migrateAnkiCards = async (filename: string, allNew: boolean) => {
	const sqlite = new Database(filename)
	const ankiDb = drizzle(sqlite)

	const _collections = await ankiDb
		.select({
			id: ankiCollections.id,
			decks: ankiCollections.decks,
			crt: ankiCollections.crt
		})
		.from(ankiCollections)
		.all()
	const collections = _collections.map(c => ({
		...c,
		decks: z.record(z.object({ name: z.string() })).parse(JSON.parse(c.decks))
	}))
	const deckToCollection = Object.fromEntries(collections.flatMap(c => {
		return Object.keys(c.decks).map(did => [ did, c ])
	}))

	const newCards = await ankiDb
		.select({
			did: ankiCards.did,
			factor: ankiCards.factor,
			type: ankiCards.type,
			due: ankiCards.due,
			ivl: ankiCards.ivl,
			reps: ankiCards.reps,
			flds: ankiNotes.flds
		})
		.from(ankiCards)
		.innerJoin(ankiNotes, eq(ankiCards.nid, ankiNotes.id))
		.orderBy(desc(ankiCards.id))
		.all()

	// Sort alphabetically by deckToCollection[card.did].decks[card.did].name
	newCards.sort((a, b) => {
		const aDeck = deckToCollection[a.did].decks[a.did]
		const bDeck = deckToCollection[b.did].decks[b.did]
		return aDeck!.name.localeCompare(bDeck!.name)
	})
	
	for (const card of newCards) {
		const [ front, back ] = z.array(z.string()).min(2).parse(card.flds.split('\x1f'))
		const existing = await db
			.select()
			.from(cards)
			.where(and(
				eq(cards.front, front),
				eq(cards.back, back)
			))
			.limit(1)
			.get()
		if (existing) continue

		let repetition: number
		let intervalMs: number
		let ease: number
		let due: Date
		if (allNew || card.type === AnkiCardType.New) {
			repetition = 0
			intervalMs = 0
			ease = 2.5
			due = new Date()
		} else if (card.type === AnkiCardType.Learning || card.type === AnkiCardType.Relearning) {
			repetition = card.reps
			intervalMs = ivlToMs(card.ivl)
			ease = card.factor / 1000
			due = new Date(card.due * 1000)
		} else {
			repetition = card.reps
			intervalMs = ivlToMs(card.ivl)
			ease = card.factor / 1000
			due = new Date((deckToCollection[card.did].crt * 1000) + (card.due * 1000 * 60 * 60 * 24))
		}

		if (false) {
			repetition = 0
			intervalMs = 0
			ease = 2.5
			due = new Date()
		}

		await db
			.insert(cards)
			.values({
				front,
				back,
				repetition,
				intervalMs,
				ease,
				due
			})
			.run()
		console.log(`Migrated card \`${front}\``)
	}
}

await migrateAnkiCards('collection.anki21', true)