import { createContext, redirect } from "react-router"
import type { Live } from "~/domain/entities/live"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import type { Route } from "../routes/app/live/+types/live-middleware"
import { repositoryContext } from "./repositories"
import { userContext } from "./user"

export const liveContext = createContext<{
	live: Live
	isOwner: boolean
}>()

export const liveMiddleware: Route.MiddlewareFunction = async ({
	request,
	context,
	params,
}) => {
	const session = await getSessionFromRequest(request)

	const liveId = Number(params.liveId)
	if (Number.isNaN(liveId)) {
		session.flash("toastPayload", {
			type: "error",
			message: "ライブが見つかりませんでした",
		})
		return redirect("/app", {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const { liveRepository } = context.get(repositoryContext)
	const result = await liveRepository.getById(liveId)
	if (!result.success) {
		session.flash("toastPayload", {
			type: "error",
			message: "データベースエラー",
		})
		return redirect("/app", {
			headers: await createSessionCommittedHeader(session),
		})
	}

	if (result.value === null) {
		session.flash("toastPayload", {
			type: "error",
			message: "ライブが見つかりませんでした",
		})
		return redirect("/app", {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const live = result.value

	const user = context.get(userContext)
	const isOwner = live.ownerId === user.id

	context.set(liveContext, { live, isOwner })
}
