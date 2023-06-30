import { FastifyReply } from 'fastify'
import { APIResponse, AuthPayload } from './types'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'

export function sendErr(reply: FastifyReply, status: number, error: string) {
	const res: APIResponse = { ok: false, error }
	return reply.status(status).send(res)
}

export function verifyCookie(rawCookie: string | undefined, jwtSecret: string) {
	if (!rawCookie) return false
	const cookieData = cookie.parse(rawCookie)
	if (!('Auth' in cookieData)) return false
	try {
		return jwt.verify(cookieData.Auth, jwtSecret) as AuthPayload
	} catch {
		return false
	}
}
