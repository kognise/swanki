import { ChatCompletionRequestMessage as Message, Configuration, OpenAIApi } from 'openai'
import type { Card } from './db'
import { Wrongness } from './scheduler'
import { z } from 'zod'

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
	basePath: 'https://api.openai.com:443/v1'
})
const openai = new OpenAIApi(configuration)

const makeExpertiseString = (expertise: string[]) => {
	if (expertise.length <= 2) {
		return expertise.join(' and ')
	} else {
		const last = expertise.pop()
		return `${expertise.join(', ')}, and ${last}`
	}
}
const makePrefix = (expertise: string[]) =>
	`You are an expert in ${makeExpertiseString(expertise)}. You're helping me drill flashcards.`

export interface RephraseCardContext {
	card: Card
	expertise: string[]
}
const rephraseCardPrompt = (ctx: RephraseCardContext): Message[] => {
	const prefix = makePrefix(ctx.expertise)
	return [
		{
			role: 'user',
			content: `${prefix} Rewrite this flashcard so it doesn't sound like a test question:\n\n${ctx.card.front}\n\nNew flashcard:`
		}
	]
}
export const rephraseCard = async (ctx: RephraseCardContext): Promise<string> => {
	const completion = await openai.createChatCompletion({
		model: 'gpt-3.5-turbo',
		temperature: 1,
		messages: rephraseCardPrompt(ctx),
		max_tokens: 128,
		frequency_penalty: 0.8,
		presence_penalty: 0.5
	})
	return completion.data.choices[0].message?.content!
}

export interface CheckAnswerContext {
	card: Card
	expertise: string[]
	answer: string
}
const checkAnswerPrompt = (ctx: CheckAnswerContext): Message[] => {
	return [
		{
			role: 'user',
			content: [
				`${makePrefix(ctx.expertise)}`,
				'',
				`Flashcard front: \`${ctx.card.front}\``,
				'',
				`Correct answer: \`${ctx.card.back}\``,
				'',
				`My answer: \`${ctx.answer}\``,
				'',
				`On a scale of 1-5, how incorrect is my answer? Be very tolerant of different ways to say the same thing, but do not tolerate missing information.`,
				'1: My answer is perfect.',
				'2: My answer is correct, but I seem a little uncertain.',
				'3: My answer is in between right and wrong.',
				'4: My answer has glimmers of correctness, but is still wrong.',
				'5: My answer is completely wrong.',
				'',
				'#:'
			].join('\n')
		}
	]
}
export const checkAnswer = async (ctx: CheckAnswerContext): Promise<Wrongness> => {
	const completion = await openai.createChatCompletion({
		model: 'gpt-3.5-turbo',
		temperature: 0.7,
		messages: checkAnswerPrompt(ctx),
		max_tokens: 1
	})
	const wrongness = completion.data.choices[0].message?.content!
	return z.nativeEnum(Wrongness).parse(parseInt(wrongness))
}

export interface ExplainWrongAnswerContext {
	card: Card
	expertise: string[]
	answer: string
	wrongness: Wrongness
}
const explainWrongAnswerPrompt = (ctx: ExplainWrongAnswerContext): Message[] => {
	return [
		...checkAnswerPrompt(ctx),
		{
			role: 'assistant',
			content: ctx.wrongness.toString()
		},
		{
			role: 'user',
			content: 'Tell me the correct answer and then explain it in a separate paragraph. DO NOT *say* you will explain the correct answer!'
		}
	]
}
export const explainWrongAnswer = async (ctx: ExplainWrongAnswerContext): Promise<string[]> => {
	const completion = await openai.createChatCompletion({
		model: 'gpt-3.5-turbo',
		temperature: 0.7,
		messages: explainWrongAnswerPrompt(ctx),
		max_tokens: 256
	})
	return completion.data.choices[0].message?.content.replace(/`/g, '"').split(/\n+/g)!
}