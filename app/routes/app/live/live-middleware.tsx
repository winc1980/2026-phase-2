import { Outlet } from "react-router"
import { liveMiddleware } from "~/middlewares/live"
import type { Route } from "./+types/live-middleware"

export const middleware: Route.MiddlewareFunction[] = [liveMiddleware]

export default function LiveMiddlewareProvider() {
	return <Outlet />
}
