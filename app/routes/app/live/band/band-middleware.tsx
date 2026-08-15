import { Outlet } from "react-router"
import { bandMiddleware } from "~/middlewares/band"
import type { Route } from "./+types/band-middleware"

export const middleware: Route.MiddlewareFunction[] = [bandMiddleware]

export default function BandMiddlewareProvider() {
	return <Outlet />
}
