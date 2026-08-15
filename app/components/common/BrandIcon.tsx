import { Music4Icon } from "lucide-react"
import { useId } from "react"

export function BrandIcon() {
	const id = useId()
	return (
		<Music4Icon className="size-6" color={`url(#${id})`}>
			<defs>
				<linearGradient
					id={id}
					x1="3"
					y1="3"
					x2="21"
					y2="21"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="var(--color-brand-gradient-from)" />
					<stop offset="50%" stopColor="var(--color-brand-gradient-via)" />
					<stop offset="100%" stopColor="var(--color-brand-gradient-to)" />
				</linearGradient>
			</defs>
		</Music4Icon>
	)
}
