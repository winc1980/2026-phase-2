import { type ReactNode, useEffect, useRef, useState } from "react"
import { useNavigation } from "react-router"
import { cn } from "~/lib/utils"

export function PageContainer({
	Header,
	Body,
}: {
	Header: ReactNode
	Body: ReactNode
}) {
	const navigation = useNavigation()
	const isLoading = Boolean(navigation.location)
	const [isLoadingDelayed, setIsLoadingDelayed] = useState(false)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	useEffect(() => {
		if (isLoading) {
			timeoutRef.current = setTimeout(() => {
				setIsLoadingDelayed(true)
			}, 200)
		} else {
			setIsLoadingDelayed(false)
		}
		return () => {
			if (timeoutRef.current) {
				setIsLoadingDelayed(false)
				clearTimeout(timeoutRef.current)
			}
		}
	}, [isLoading])
	return (
		<div className="flex flex-col w-full items-center h-full overflow-y-auto">
			<header className="w-full border-b relative">
				<div
					className={cn(
						"absolute -bottom-1 w-full h-1 bg-linear-to-b from-primary via-primary/75 to-transparent transition-opacity opacity-0",
						isLoadingDelayed && "opacity-25",
					)}
				/>
				<div className="mx-auto w-full max-w-5xl h-full px-4">{Header}</div>
			</header>
			<main className="w-full grow">
				<div className="mx-auto w-full max-w-5xl px-4 py-6">{Body}</div>
			</main>
		</div>
	)
}
