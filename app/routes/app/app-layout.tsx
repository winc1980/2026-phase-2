import { Link, Outlet } from "react-router"
import { AccountDropdownMenu } from "~/components/common/AccountDropdownMenu"
import { BrandIcon } from "~/components/common/BrandIcon"
import { PageContainer } from "~/components/common/PageContainer"
import { Button } from "~/components/ui/button"
import { userContext, userMiddleware } from "~/middlewares/user"
import type { Route } from "./+types/app-layout"

export const middleware: Route.MiddlewareFunction[] = [userMiddleware]

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	return { user }
}

export default function AppLayout({
	loaderData: { user },
}: Route.ComponentProps) {
	return (
		<PageContainer
			Header={
				<div className="h-16 flex items-center justify-between">
					<Button variant="ghost" className="size-12" asChild>
						<Link to="/app">
							<BrandIcon />
						</Link>
					</Button>
					<div className="flex items-center">
						<AccountDropdownMenu user={user} />
					</div>
				</div>
			}
			Body={<Outlet />}
		/>
	)
}
