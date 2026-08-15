import "dotenv"
import { createCookieSessionStorage, type Session } from "react-router"
import type { ToastPayload } from "~/components/common/toast"

const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET)
	throw new Error("環境変数「SESSION_SECRET」が設定されていません")

type SessionData = {
	sessionToken: string
	applicationToken?: string
}

type SessionFlashData = {
	toastPayload: ToastPayload
	redirectAfterAuth?: string
}

export const { getSession, commitSession, destroySession } =
	createCookieSessionStorage<SessionData, SessionFlashData>({
		cookie: {
			name: "__session",
			httpOnly: true,
			sameSite: "lax",
			secrets: [SESSION_SECRET],
			secure: true,
		},
	})

export const getSessionFromRequest = (request: Request) =>
	getSession(request.headers.get("Cookie"))

export const createSessionCommittedHeader = async (
	session: Session,
): Promise<ResponseInit["headers"]> => {
	return { "Set-Cookie": await commitSession(session) }
}
