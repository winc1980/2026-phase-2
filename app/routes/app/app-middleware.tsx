import { Outlet } from "react-router"
import { userMiddleware } from "~/middlewares/user"
import type { Route } from "./+types/app-middleware"

export const middleware: Route.MiddlewareFunction[] = [userMiddleware]

export default function AppMiddlewareProvider() {
	return <Outlet />
}
