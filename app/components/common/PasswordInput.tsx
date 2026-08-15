import { EyeIcon, EyeOffIcon } from "lucide-react"
import { type ComponentProps, useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

export function PasswordInput(props: ComponentProps<"input">) {
	const [show, setShow] = useState(false)

	return (
		<div className="relative">
			<Input {...props} type={show ? "text" : "password"} />
			<Button
				onClick={() => setShow((prev) => !prev)}
				className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
				size="icon"
				type="button"
				variant="ghost"
				tabIndex={-1}
			>
				{show ? (
					<EyeOffIcon className="size-4 text-muted-foreground" />
				) : (
					<EyeIcon className="size-4 text-muted-foreground" />
				)}
			</Button>
		</div>
	)
}
