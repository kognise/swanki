const correct = [
	`Absolutely correct.`,
	`Spot on answer.`,
	`Precisely!`,
	`Well done.`,
	`Indeed.`,
	`That's right.`,
	`Great job.`,
	`Perfect!`,
	`Correct.`,
	`You got it.`,
	`Nice work.`,
	`Yes, indeed.`,
	`That's it.`,
	`Nailed it.`,
	`Excellent.`,
	`Good job.`,
	`Exactly!`,
	`On point.`,
	`Correct answer.`,
	`Very good.`,
	`Nicely done!`,
	`Fine work.`,
	`That's correct.`,
	`Right on.`,
	`Superb.`,
	`Great answer.`,
	`Wonderful.`,
	`100% correct!`,
	`Top-notch.`,
	`You got this!`,
	`Good answer.`,
	`Just right.`,
	`Keep it up.`,
	`Aced it!`,
	`Well played.`,
	`Definitely.`,
	`Good work.`,
	`That was perfect.`,
	`Fabulous.`,
	`Flawless.`,
	`Good going.`,
	`Ding ding ding!`,
	`Success.`,
	`Spot-on answer.`,
	`You nailed it.`,
	`Bravo!`,
	`Right on target.`,
	`You've got it.`,
	`You aced it.`,
	`Terrific.`,
	`Keep up the good work.`,
	`Congrats.`,
	`Stellar job.`,
	`Impressive.`,
	`Sound answer.`,
	`Clever response.`,
	`You did it.`,
	`Great reasoning.`,
	`Well figured out.`,
	`No doubt.`,
	`Worthy.`,
	`Fantastic.`,
	`Good understanding!`,
	`Good memory :)`,
	`Right as rain, as they say.`,
	`Nice one!`,
	`Yep!`,
	`Exceptional.`,
	`Well-said.`,
	`Great response.`,
	`That's the right answer!`
]

const inBetween = [
	`Not *quite*`,
	`Almost there!`,
	`Halfway there.`,
	`You're partly right.`,
	`A bit off!`,
	`That's the right direction...`,
	`Good start!`,
	`Slightly off.`,
	`On the fence...`,
	`You're getting there...`,
	`Some of that's correct.`,
	`Partially right, but there's some room for improvement:`,
	`Not entirely correct.`,
	`Somewhat accurate.`,
	`You're partially wrong.`,
	`Not quite right.`,
	`Pretty close.`,
	`A few errors.`,
	`You're not completely wrong...`,
	`Close, but needs a bit of work.`,
	`Pretty good attempt.`,
]

const wrong = [
	`That's okay, you'll get it next time!`,
	`Good try, but unfortunately wrong.`,
	`Unfortunately, that's not the answer.`,
	`Not quite, but you'll get another chance!`,
	'No problem, you\'ll get it next time!',
	'Don\'t worry, just give it another try.',
	'Keep trying, you\'ll get the hang of it!',
	'Everyone gets things wrong sometimes, keep going.',
	'That\'s alright, you\'ll get it eventually!',
	'Remember, persistence is key.',
	'It\'s okay, we\'re here to learn.',
	'Nobody gets everything right the first time!',
	'Hang in there, you\'re making progress!',
	'You\'re doing better than you think!',
	'Just need a bit more practice, you got this.',
	'Keep your head up and you\'ll remember it next time.',
	'This one was tough, don\'t worry!',
	'It\'s okay, you\'ll remember better next time!',
	'Mistakes happen!',
	'That\'s alright! You\'ve got another chance.',
	'It takes time to learn, keep trying!',
	'You\'ll remember it better next round.',
	'You\'re doing great, just needs more practice.',
	'You\'ll get there, just keep practicing!',
	'It gets easier with time, keep trying.',
	'Good effort! Just keep working on it.',
	'It\'s okay, you\'re still learning.',
	'Don\'t stress, just give it another shot!',
	'You\'re doing well, but you\'ll get it.'
]

/**
 * @returns {Promise<{ noCards: true } | { cardId: number, rephrasing: string }>}
 */
const getNextCard = async () => {
	const res = await fetch('/api/next')
	if (!res.ok) throw new Error(`Failed to fetch next card: ${res.status} ${res.statusText}`)
	return await res.json()
}

/**
 * @param {string} answer 
 * @param {number} cardId 
 * @returns {Promise<{ wrongness: number, due: Date, needsExplanation: boolean }>}
 */
const submitAnswer = async (answer, cardId) => {
	const res = await fetch(
		`/api/answer?cardId=${encodeURIComponent(cardId)}&answer=${encodeURIComponent(answer)}`,
		{ method: 'POST' }
	)
	if (!res.ok) throw new Error(`Failed to submit answer: ${res.status} ${res.statusText}`)
	const data = await res.json()
	return {
		...data,
		due: new Date(data.due)
	}
}

/**
 * @param {string} answer 
 * @param {number} cardId 
 * @param {number} wrongness
 * @returns {Promise<{ explanation: string[] }>}
 */
const getExplanation = async (answer, cardId, wrongness) => {
	const res = await fetch(
		`/api/explain?cardId=${encodeURIComponent(cardId)}&answer=${encodeURIComponent(answer)}&wrongness=${encodeURIComponent(wrongness)}`,
		{ method: 'POST' }
	)
	if (!res.ok) throw new Error(`Failed to get explanation: ${res.status} ${res.statusText}`)
	return await res.json()
}

/**
 * @param {'ai' | 'user'} agent
 * @returns {HTMLDivElement}
 */
const createBubble = (agent) => {
	if (!document.querySelector('.group:last-of-type').classList.contains(agent)) {
		const group = document.createElement('div')
		group.classList.add('group')
		group.classList.add(agent)
		document.querySelector('.bubbles').appendChild(group)
	}

	const bubble = document.createElement('div')
	bubble.classList.add('bubble')
	document.querySelector(`.group.${agent}:last-of-type`).appendChild(bubble)

	return bubble
}

/**
 * @param {'ai' | 'user'} agent 
 * @param {string} text 
 */
const createTextBubble = (agent, text) => {
	createBubble(agent).innerText = text

	// Scroll to bottom of .bubbles
	document.querySelector('.bubbles').scrollTop = document.querySelector('.bubbles').scrollHeight 
}

/**
 * @param {'ai' | 'user'} agent
 */
const createLoaderBubble = (agent) => {
	const bubble = createBubble(agent)
	bubble.classList.add('loader')
	bubble.innerHTML = '<div><div></div><div></div><div></div></div>'
	bubble.style.display = 'none'
	setTimeout(() => {
		bubble.style.display = 'block'

		// Scroll to bottom of .bubbles
		document.querySelector('.bubbles').scrollTop = document.querySelector('.bubbles').scrollHeight 
	}, 500)
}

/**
 * 
 * @param {number} ms 
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const chatInput = document.querySelector('#chat-input')
const chatForm = document.querySelector('#chat-form')

chatInput.addEventListener('keypress', (event) => {
	if (event.which === 13 && !event.shiftKey) {
		event.preventDefault()
		chatForm.dispatchEvent(new Event('submit'))
	}
})

chatInput.addEventListener('input', () => {
	chatInput.style.height = ''
	chatInput.style.height = Math.min(chatInput.scrollHeight, 180) + 'px'
})

/**
 * @type {{ cardId: number } | null}
 */
let answerCard = null

const loadNextCard = async () => {
	createLoaderBubble('ai')
	await delay(500 + Math.random() * 1000)
	try {
		answerCard = await getNextCard()
		createTextBubble('ai', answerCard.noCards
			? `Sorry, there aren't any cards to review.`
			: answerCard.rephrasing)
	} catch (error) {
		createTextBubble('ai', error.message || error.toString())
	} finally {
		document.querySelector('.loader').remove()
	}
}

chatForm.addEventListener('submit', async (event) => {
	event.preventDefault()
	
	if (!answerCard) return
	const text = chatInput.value
	const cardId = answerCard.cardId

	answerCard = null
	chatInput.value = ''

	createTextBubble('user', text)
	createLoaderBubble('ai')
	const answer = await submitAnswer(text, cardId)
	console.log(answer)
	document.querySelector('.loader').remove()

	let response
	if (answer.wrongness <= 2) {
		response = correct[Math.floor(Math.random() * correct.length)]
	} else if (answer.wrongness === 3) {
		response = inBetween[Math.floor(Math.random() * inBetween.length)]
	} else {
		response = wrong[Math.floor(Math.random() * wrong.length)]
	}
	createTextBubble('ai', response)

	if (answer.needsExplanation) {
		createLoaderBubble('ai')

		const { explanation } = await getExplanation(text, cardId, answer.wrongness)
		for (let i = 0; i < explanation.length; i++) {
			document.querySelector('.loader').remove()
			createTextBubble('ai', explanation[i])

			if (i !== explanation.length - 1) { // Not the last message
				createLoaderBubble('ai')
				await delay(800 + Math.random() * 3000)
			}
		}
	}

	await delay(500)
	await loadNextCard()
})

await loadNextCard()