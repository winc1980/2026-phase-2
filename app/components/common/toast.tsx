import { toast } from "sonner"

export type ToastType = "info" | "success" | "error"

export type ToastPayload = {
	type: ToastType
	message: string
}

export function showToast(payload: ToastPayload): void {
	if (payload.type === "info") {
		toast.info(payload.message)
	} else if (payload.type === "success") {
		toast.success(payload.message)
	} else if (payload.type === "error") {
		toast.error(payload.message)
	}
}
