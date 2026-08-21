import { data, isRouteErrorResponse, Outlet } from "react-router"
import { showToast } from "~/components/common/toast"
import { Toaster } from "~/components/ui/sonner"
import { BaseError } from "~/lib/error"
import { repositoryMiddleware } from "~/middlewares/repositories"
import { commitSession, getSession } from "~/sessions/sessions"
import type { Route } from "./+types/root-layout"
import { useEffect } from "react"


export const middleware: Route.MiddlewareFunction[] = [repositoryMiddleware]

export async function loader({ request }: Route.LoaderArgs) {
	const session = await getSession(request.headers.get("Cookie"))
	const toastPayload = session.get("toastPayload")
	return data(
		{ toastPayload },
		{ headers: { "Set-Cookie": await commitSession(session) } },
	)
}

export default function RootLayout({ loaderData }: Route.ComponentProps) {
	if (loaderData.toastPayload) {
		// 副作用
		useEffect (() => {
			if(loaderData.toastPayload !==undefined){
			showToast(loaderData.toastPayload)
			}
		}, [loaderData.toastPayload])
	}

	return (
		<>
			<Toaster position="top-center" />
			<Outlet />
		</>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	if (isRouteErrorResponse(error)) {
		return (
			<div>
				<h1>
					{error.status} {error.statusText}
				</h1>
				<p>{error.data}</p>
			</div>
		)
	}
	if (error instanceof BaseError) {
		return (
			<div className="text-destructive">
				<h1>エラー</h1>
				<h2>{error.name}</h2>
				<p>{error.message}</p>
			</div>
		)
	}
	return (
		<div className="text-destructive">
			<h1>不明なエラー</h1>
			<h2>{String(error)}</h2>
		</div>
	)
}
