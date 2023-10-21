import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { logger } from 'hono/logger'
import { validator } from 'hono/validator'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { db, cards } from './db'
import { getNextCard, scheduleCard, Wrongness } from './scheduler'
import { rephraseCard, checkAnswer, explainWrongAnswer } from './ai'

const expertise = [ 'aviation', 'FAA regulations' ]

const app = new Hono()

app.use('*', logger())
app.use('*', serveStatic({ root: './public' }))

app.get('/api/next', async (ctx) => {
	const card = await getNextCard()
	if (!card) return ctx.json({ noCards: true })	

	return ctx.json({
		cardId: card.id,
		rephrasing: card.front
	})
})

app.post(
	'/api/answer',
	zValidator('query', z.object({
		cardId: z.string().regex(/^\d+$/).transform(Number),
		answer: z.string().nonempty().max(256)
	})),
	async (ctx) => {
		const body = ctx.req.valid('query')
		const card = await db
			.select()
			.from(cards)
			.where(eq(cards.id, body.cardId))
			.limit(1)
			.all()[0]

		console.log(card.front)
		console.log(card.back)

		const wrongness = await checkAnswer({ card, expertise, answer: body.answer })
		const due = await scheduleCard(card, wrongness)

		return ctx.json({
			wrongness,
			due,
			needsExplanation: wrongness >= Wrongness.Difficult
		})
	}
)

app.post(
	'/api/explain',
	zValidator('query', z.object({
		cardId: z.string().regex(/^\d+$/).transform(Number),
		answer: z.string().nonempty().max(256),
		wrongness: z.string().regex(/^\d+$/).transform(Number)
	})),
	async (ctx) => {
		const body = ctx.req.valid('query')
		const card = await db
			.select()
			.from(cards)
			.where(eq(cards.id, body.cardId))
			.limit(1)
			.all()[0]

		const explanation = await explainWrongAnswer({ card, expertise, wrongness: body.wrongness, answer: body.answer })
		return ctx.json({ explanation })
	}
)

export default {
	port: 3000,
	fetch: app.fetch
}