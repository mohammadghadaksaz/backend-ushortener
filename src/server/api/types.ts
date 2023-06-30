export interface UsersNewBody {
	username: string
	email: string
	password: string
}

export interface AuthPayload {
	username: string
}

export interface UsersLoginBody {
	username: string
	password: string
}

export interface UserActivateParams {
	username: string
	token: string
}

export interface URLsAddBody {
	url: string
}

export interface URLsRedirectParams {
	shortID: string
}

export type APIResponse = { ok: false; error: string } | { ok: true; data: any }

export interface Mail {
	from: string
	to: string
	subject: string
	html: string
}

export type MailSender = (mail: Mail) => unknown
