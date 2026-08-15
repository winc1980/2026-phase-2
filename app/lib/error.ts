export abstract class BaseError extends Error {
	public abstract readonly name: string
	public readonly message: string
	public readonly cause?: unknown

	constructor(message: string, cause?: unknown) {
		super(message)
		this.message = message
		this.cause = cause
	}
}

export class UnknownError extends BaseError {
	name = "UnknownError"
}
