import { createContext, type MiddlewareFunction, redirect } from "react-router"
import {
	ExpiredSessionTokenError,
	InvalidSessionTokenError,
} from "~/domain/data/errors"
import type { User } from "~/domain/entities/user"
import { verifyToken } from "~/sessions/jwt"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import { repositoryContext } from "./repositories"

export const userContext = createContext<User>()

export const userMiddleware: MiddlewareFunction<Response> = async ({
	request,
	context,
}) => {
	const session = await getSessionFromRequest(request)

	const sessionToken = session.get("sessionToken")
	if (!sessionToken) {
		session.unset("sessionToken")
		session.flash("redirectAfterAuth", request.url)
		session.flash("toastPayload", {
			type: "info",
			message: "ログインしてください",
		})

		return redirect("/auth/login", {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const result = await verifyToken(sessionToken)
	if (!result.success) {
		session.unset("sessionToken")
		if (result.error instanceof InvalidSessionTokenError) {
			session.flash("toastPayload", {
				type: "error",
				message: "無効なセッションです。ログインし直してください。",
			})
		} else if (result.error instanceof ExpiredSessionTokenError) {
			session.flash("toastPayload", {
				type: "error",
				message: "セッション期限切れです。ログインし直してください。",
			})
		}
		session.flash("redirectAfterAuth", request.url)
		return redirect("/auth/login", {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const payload = result.value
	const { userRepository } = context.get(repositoryContext)
	const repositoryResult = await userRepository.getById(payload.id)

	if (!repositoryResult.success) {
		session.unset("sessionToken")
		session.flash("toastPayload", {
			type: "error",
			message: "エラーが発生しました。ログインし直してください。",
		})
		session.flash("redirectAfterAuth", request.url)
		return redirect("/auth/login", {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const user = repositoryResult.value

	if (user === null) {
		session.unset("sessionToken")
		session.flash("toastPayload", {
			type: "error",
			message: "存在しないユーザーです。ログインし直してください。",
		})
		session.flash("redirectAfterAuth", request.url)
		return redirect("/auth/login", {
			headers: await createSessionCommittedHeader(session),
		})
	}

	context.set(userContext, user)
}
