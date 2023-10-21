import { lte, asc, eq } from 'drizzle-orm'
import { type Card, cards, db } from './db'

export enum Wrongness {
	Perfect = 1,
	MostlyPerfect,
	Difficult,
	MostlyWrong,
	Wrong
}

export const getNextCard = async (): Promise<Card | undefined> => {
	return await db
		.select()
		.from(cards)
		.where(lte(cards.due, new Date()))
		.orderBy(asc(cards.due), asc(cards.id))
		.limit(1)
		.all()[0]
}

export const scheduleCard = async (card: Card, wrongness: Wrongness): Promise<Date> => {
	let intervalMs
	let repetition
	if (wrongness <= Wrongness.MostlyPerfect) {
		if (card.repetition === 0) {
			intervalMs = 1 * 60 * 60 * 24
		} else if (card.repetition === 1) {
			intervalMs = 5 * 60 * 60 * 24
		} else {
			intervalMs = Math.round(card.intervalMs * card.ease)
		}
		repetition = card.repetition + 1
	} else if (wrongness === Wrongness.Wrong) {
		intervalMs = 5 * 60 * 1000
		repetition = 0
	} else {
		intervalMs = 1 * 60 * 60 * 24
		repetition = 0
	}

	const due = new Date(Date.now() + intervalMs)
	await db
		.update(cards)
		.set({
			ease: Math.min(
				card.ease + (0.1 - (wrongness - 1) * (0.08 + (wrongness - 1) * 0.04)),
				1.3
			),
			intervalMs,
			repetition,
			due
		})
		.where(eq(cards.id, card.id))
		.run()
	
	return due
}