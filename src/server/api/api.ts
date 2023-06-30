import { FastifyPluginCallback } from 'fastify'
import hs from 'http-status'
import { MailSender } from './types'
import { DB } from '../../db/db'
import { UsersPlugin } from './plugins/users'
import { URLsPlugin } from './plugins/urls'
import { sendErr } from './utils'

interface APIRoutesOptions {
	sendMail: MailSender
	externalAppHostname: string
	jwtSecret: string
	mailDomain: string
	db: DB
}

export function APIRoutes(o: APIRoutesOptions): FastifyPluginCallback {
	const { db } = o
	return (s, _, done) => {
		s.setErrorHandler((_, __, reply) => {
			sendErr(reply, hs.INTERNAL_SERVER_ERROR, 'internal server error')
		})

		s.register(UsersPlugin(o), { prefix: '/users' })
		s.register(URLsPlugin(db, o.jwtSecret), { prefix: '/u' })
		done()
	}
}
