import { LogOutIcon, UserIcon } from "lucide-react"
import { Link } from "react-router"
import type { User } from "~/domain/entities/user"
import { Button } from "../ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export function AccountDropdownMenu({ user }: { user: User }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size="icon-lg" variant="ghost">
					<UserIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuGroup>
					<DropdownMenuLabel className="text-sm">
						<div>{user.name}</div>
					</DropdownMenuLabel>
					<DropdownMenuLabel>
						<div>{user.mail}</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<Link to="/auth/logout" className="flex items-center gap-2 w-full">
							<LogOutIcon />
							ログアウト
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
