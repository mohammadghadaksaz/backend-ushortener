import { FastifyPluginCallback } from "fastify";
import { DB, DBErrCodeItemAlreadyExists, DBRequestErr } from "../../../db/db";
import {
	APIResponse,
	AuthPayload,
	MailSender,
	UserActivateParams,
	UsersLoginBody,
	UsersNewBody,
} from "../types";
import { usersLoginSchema, usersNewSchema } from "../schemas";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendErr, verifyCookie } from "../utils";
import hs from "http-status";
import cookie from "cookie";

export interface UsersControllersOptions {
	sendMail: MailSender;
	externalAppHostname: string;
	jwtSecret: string;
	mailDomain: string;
	db: DB;
}

export function UsersPlugin(o: UsersControllersOptions): FastifyPluginCallback {
	const { db } = o;

	const userNewOpts = { schema: usersNewSchema };
	return (s, _, done) => {
		s.post<{ Body: UsersNewBody }>("/add", userNewOpts, async (req, reply) => {
			let activationToken: string;
			const { username, email, password } = req.body;
			const hashedPassword = await bcrypt.hash(password, 10);
			try {
				const user = await db.createUser({
					username,
					email,
					password: hashedPassword,
				});
				activationToken = user.activationId;
			} catch (e) {
				if (e instanceof DBRequestErr) {
					if (e.code === DBErrCodeItemAlreadyExists) {
						// @ts-ignore
						const duplicatePart = e?.meta?.target[0] ?? "credentials";
						const errMsg = `User with the same ${duplicatePart} already exists!`;
						sendErr(reply, hs.BAD_REQUEST, errMsg);
						return;
					}
				}

				sendErr(reply, hs.INTERNAL_SERVER_ERROR, "internal server error");
				return;
			}

			o.sendMail({
				to: email,
				from: `urlShortener <noreply@${o.mailDomain}>`,
				subject: "activate your account",
				html: `<h1>Click this link to activate your account</h1>\n<a href="http://${o.externalAppHostname}/api/users/activate/${username}/${activationToken}">http://${o.externalAppHostname}/api/users/activate/${username}/${activationToken}</a>`,
			});

			const res: APIResponse = { ok: true, data: {} };
			return res;
		});

		const userLoginOpts = { schema: usersLoginSchema };
		s.post<{ Body: UsersLoginBody }>(
			"/login",
			userLoginOpts,
			async (req, reply) => {
				const { username, password } = req.body;
				const user = await db.getUser(username);
				if (!user) {
					sendErr(
						reply,
						hs.BAD_REQUEST,
						"Invalid username password combination."
					);
					return;
				}

				if (!user.activated) {
					sendErr(
						reply,
						hs.BAD_REQUEST,
						"In order to login, first you need to activate your account."
					);
					return;
				}

				const passwordIsValid = await bcrypt.compare(password, user.password);
				if (!passwordIsValid) {
					sendErr(
						reply,
						hs.BAD_REQUEST,
						"Invalid username password combination."
					);
					return;
				}

				const authPayload: AuthPayload = { username };
				const token = jwt.sign(authPayload, o.jwtSecret, { expiresIn: "7d" });
				reply.header(
					"Set-Cookie",
					cookie.serialize("Auth", token, { httpOnly: true, path: "/" })
				);

				const res: APIResponse = { ok: true, data: {} };
				return res;
			}
		);

		s.get("/logged_in", async (req, reply) => {
			const c = verifyCookie(req.headers.cookie, o.jwtSecret);
			let res: APIResponse;
			if (!c) res = { ok: true, data: { isLoggedIn: false } };
			else res = { ok: true, data: { isLoggedIn: true } };
			reply.send(res);
		});

		s.post("/logout", async (_, reply) => {
			const res: APIResponse = { ok: true, data: {} };
			reply
				.header(
					"Set-Cookie",
					cookie.serialize("Auth", "", {
						httpOnly: true,
						path: "/",
						expires: new Date(2000, 1, 1),
					})
				)
				.send(res);
		});

		s.get<{ Params: UserActivateParams }>(
			"/activate/:username/:token",
			async (req, reply) => {
				const { username, token } = req.params;
				const user = await db.getUser(username);
				if (!user || user.activationId !== token) {
					sendErr(reply, hs.BAD_REQUEST, "invalid credentials");
					return;
				}

				await db.activateUser(user.username);

				reply
					.header("Location", `http://${o.externalAppHostname}/?activated=1`)
					.status(hs.FOUND)
					.send("");
			}
		);

		done();
	};
}
