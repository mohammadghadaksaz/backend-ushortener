import { PrismaClient, Prisma } from '@prisma/client'
import { v4 as uuid } from 'uuid'

export type DB = ReturnType<typeof initDB>
export const DBRequestErr = Prisma.PrismaClientKnownRequestError

export const DBErrCodeItemAlreadyExists = 'P2002'

interface CreateUserParams {
	username: string
	password: string
	email: string
}

interface CreateURLParams {
	username: string
	url: string
	shortID: string
}

export function initDB() {
	const prisma = new PrismaClient()

	const createUser = (c: CreateUserParams) => {
		return prisma.user.create({ data: { ...c, activationId: uuid() } })
	}

	const getUser = (username: string) => {
		return prisma.user.findUnique({ where: { username } })
	}

	const activateUser = (username: string) => {
		return prisma.user.update({ where: { username }, data: { activated: true } })
	}

	const getURLs = (username: string) => {
		return prisma.shortURL.findMany({ where: { username } })
	}

	const createURL = (o: CreateURLParams) => {
		return prisma.shortURL.create({ data: { ...o } })
	}

	const setURLViews = (id: number, views: number) => {
		return prisma.shortURL.update({ where: { id }, data: { views } })
	}

	const getURLByShortID = (shortID: string) => {
		return prisma.shortURL.findUnique({ where: { shortID } })
	}

	const disconnect = () => prisma.$disconnect()

	return {
		getUser,
		createUser,
		activateUser,

		createURL,
		getURLs,
		getURLByShortID,
		setURLViews,

		disconnect,
	}
}
