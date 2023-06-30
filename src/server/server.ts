import Fastify from 'fastify'
import { APIRoutes } from './api/api'
import { DB } from '../db/db'
import { MailSender } from './api/types'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'path'
import appRoot from 'app-root-path'

export interface ServerConfig {
	host?: string
	port: number
	db: DB
	sendMail: MailSender
	mailDomain: string
	jwtSecret: string
	externalHostname: string
}

export function runServer(c: ServerConfig) {
	const s = Fastify({ logger: true })
	s.register(cors, { origin: true, credentials: true })

	s.register(fastifyStatic, {
		root: path.join(appRoot + '/public'),
	})

	s.get('/dashboard', (_, reply) => {
		reply.sendFile('index.html')
	})

	s.get('/sign_up', (_, reply) => {
		reply.sendFile('index.html')
	})

	s.register(
		APIRoutes({
			db: c.db,
			jwtSecret: c.jwtSecret,
			externalAppHostname: c.externalHostname,
			mailDomain: c.mailDomain,
			sendMail: c.sendMail,
		}),
		{ prefix: '/api' }
	)

	s.listen({ host: c.host, port: c.port })
}
