import { FastifyPluginCallback } from 'fastify'
import { DB } from '../../../db/db'
import { sendErr, verifyCookie } from '../utils'
import { APIResponse, URLsAddBody, URLsRedirectParams } from '../types'
import { URLsAddSchema } from '../schemas'
import hs from 'http-status'
import { nanoid } from 'nanoid'

export function URLsPlugin(db: DB, jwtSecret: string): FastifyPluginCallback {
	return (s, _, done) => {
		s.get('/', async (req, reply) => {
			const c = verifyCookie(req.headers.cookie, jwtSecret)
			if (!c) {
				sendErr(reply, hs.UNAUTHORIZED, 'unauthorized')
				return
			}
			const urls = await db.getURLs(c.username)
			const res: APIResponse = {
				ok: true,
				data: {
					urls: urls.map(u => ({
						url: u.url,
						shortID: u.shortID,
						views: u.views,
						createdAt: u.createdAt,
					})),
				},
			}
			return res
		})

		const URLsAddOpts = { schema: URLsAddSchema }
		s.post<{ Body: URLsAddBody }>('/add', URLsAddOpts, async (req, reply) => {
			const { url } = req.body
			const c = verifyCookie(req.headers.cookie, jwtSecret)
			if (!c) {
				sendErr(reply, hs.UNAUTHORIZED, 'unauthorized')
				return
			}
			await db.createURL({ url, shortID: nanoid(), username: c.username })
			const res: APIResponse = { ok: true, data: {} }
			return res
		})

		s.get<{ Params: URLsRedirectParams }>('/:shortID', async (req, reply) => {
			const { shortID } = req.params
			const dbURL = await db.getURLByShortID(shortID)
			if (!dbURL) return reply.status(hs.NOT_FOUND).send('Page not found!')
			await db.setURLViews(dbURL.id, dbURL.views + 1)
			return reply.header('Location', dbURL.url).status(hs.FOUND).send('')
		})
		done()
	}
}
