import { readFile } from 'fs/promises'
import Ajv from 'ajv'

export interface Config {
	jwtSecret: string
	externalHostname: string
	server: {
		hostname?: string
		port: number
	}
	mail: {
		hostname: string
		port: number
		username: string
		password: string
		senderDomain: string
	}
}

const configSchema = {
	type: 'object',
	additionalProperties: false,
	required: ['jwtSecret', 'externalHostname', 'server', 'mail'],
	properties: {
		jwtSecret: { type: 'string', minLength: 15 },
		externalHostname: { type: 'string' },
		server: {
			type: 'object',
			required: ['port'],
			properties: {
				port: { type: 'number' },
				hostname: { type: 'string' },
			},
		},
		mail: {
			type: 'object',
			required: ['hostname', 'port', 'username', 'password', 'senderDomain'],
			properties: {
				hostname: { type: 'string' },
				port: { type: 'number' },
				username: { type: 'string' },
				password: { type: 'string' },
				senderDomain: { type: 'string' },
			},
		},
	},
} as const

export async function loadConfig(configPath: string): Promise<Config> {
	const configStr = await readFile(configPath, 'utf-8')
	const configData = JSON.parse(configStr)

	const ajv = new Ajv()
	const isValid = ajv.validate(configSchema, configData)
	if (!isValid) {
		const errMessages = ajv.errors
			?.map(err => err.message)
			.filter(err => err !== undefined) as string[]
		throw new Error(`invalid config format: ${errMessages.join('\n')}`)
	}

	return configData as Config
}
