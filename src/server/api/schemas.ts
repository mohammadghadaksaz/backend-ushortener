export const usersNewSchema = {
	body: {
		type: 'object',
		required: ['username', 'password', 'email'],
		properties: {
			username: { type: 'string' },
			email: { type: 'string', format: 'email' },
			password: { type: 'string', minLength: 8 },
		},
	},
} as const

export const usersLoginSchema = {
	body: {
		type: 'object',
		required: ['username', 'password'],
		properties: {
			username: { type: 'string' },
			password: { type: 'string' },
		},
	},
} as const

export const URLsAddSchema = {
	body: {
		type: 'object',
		required: ['url'],
		properties: {
			url: { type: 'string' },
		},
	},
}
