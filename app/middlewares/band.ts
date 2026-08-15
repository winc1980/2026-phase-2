import { createContext, redirect } from "react-router"
import type { Band } from "~/domain/entities/band"
import {
	createSessionCommittedHeader,
	getSessionFromRequest,
} from "~/sessions/sessions"
import type { Route } from "../routes/app/live/band/+types/band-middleware"
import { liveContext } from "./live"
import { repositoryContext } from "./repositories"
import { userContext } from "./user"

export const bandContext = createContext<{
	band: Band
	isLeader: boolean
	isApproved: boolean
}>()

export const bandMiddleware: Route.MiddlewareFunction = async ({
	request,
	context,
	params,
}) => {
	const session = await getSessionFromRequest(request)

	const { live } = context.get(liveContext)

	const bandId = Number(params.bandId)
	if (Number.isNaN(bandId)) {
		session.flash("toastPayload", {
			type: "error",
			message: "バンドが見つかりませんでした",
		})
		return redirect(`/app/live/${live.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const { bandRepository } = context.get(repositoryContext)
	const result = await bandRepository.getById(bandId)

	if (!result.success) {
		session.flash("toastPayload", {
			type: "error",
			message: "データベースエラー",
		})
		return redirect(`/app/live/${live.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const band = result.value

	if (band === null) {
		session.flash("toastPayload", {
			type: "error",
			message: "バンドが見つかりませんでした",
		})
		return redirect(`/app/live/${live.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const result2 = await bandRepository.getIsApproved(band.id)
	if (!result2.success) {
		session.flash("toastPayload", {
			type: "error",
			message: "データベースエラー",
		})
		return redirect(`/app/live/${live.id}`, {
			headers: await createSessionCommittedHeader(session),
		})
	}

	const isApproved = result2.value

	const user = context.get(userContext)

	const isLeader = band.leaderId === user.id

	context.set(bandContext, { band, isLeader, isApproved })
}
