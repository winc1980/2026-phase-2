import type { LucideIcon } from "lucide-react"
import { Link } from "react-router"
import { useIsActive } from "~/hooks/useIsActive"
import { cn } from "~/lib/utils"
import { Button } from "../ui/button"

export function LinkTabButton({
	to,
	Icon,
	label,
	end = false,
}: {
	to: string
	Icon: LucideIcon
	label: string
	end?: boolean
}) {
	const isActive = useIsActive(to, { end })
	return (
		<div
			className={cn(
				"h-full flex items-center justify-center border-b-2 transition-colors min-w-20 w-fit px-1",
				isActive ? "border-b-primary" : "border-b-transparent",
			)}
		>
			<Button variant="ghost" size="lg" className="w-full" asChild>
				<Link to={to} className="inline-flex items-baseline gap-1">
					<Icon className="size-4" />
					<span>{label}</span>
				</Link>
			</Button>
		</div>
	)
}
