import appRoot from 'app-root-path'
import { initDB } from './db/db'
import { runServer } from './server/server'
import { loadConfig } from './config/config'
import { initMailServer } from './mail/mail'

const CONFIG_PATH = appRoot + '/config.json'

async function main() {
	const c = await loadConfig(CONFIG_PATH)
	const { externalHostname, jwtSecret } = c
	const { port, hostname: host } = c.server
	const { senderDomain: mailDomain } = c.mail
	const db = initDB()
	const mailServer = initMailServer(c.mail)
	await runServer({
		db,
		externalHostname,
		jwtSecret,
		port,
		host,
		mailDomain,
		sendMail: mailServer.sendMail,
	})
	await db.disconnect()
}

main()
