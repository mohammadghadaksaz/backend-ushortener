import { Mail } from '../server/api/types'
import nodemailer from 'nodemailer'

interface MailServerOptions {
	hostname: string
	port: number
	username: string
	password: string
}

export function initMailServer(o: MailServerOptions) {
	const transport = nodemailer.createTransport({
		// @ts-ignore
		tls: true,
		host: o.hostname,
		port: o.port,
		auth: {
			user: o.username,
			pass: o.password,
		},
	})

	const sendMail = async (mail: Mail) => {
		await transport.sendMail(mail)
	}

	return { sendMail }
}
