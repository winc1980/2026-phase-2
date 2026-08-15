import { type BaseError, UnknownError } from "./error"

export type Result<T, E extends BaseError> = Success<T> | Fail<E>

export class Success<T> {
	public readonly success = true
	public readonly value: T
	constructor(value: T) {
		this.value = value
	}
}

export class Fail<E extends BaseError> {
	public readonly success = false
	public readonly error: E
	constructor(error: E) {
		this.error = error
	}
}

export function success<T>(value: T): Success<T> {
	return new Success(value)
}

export function fail<E extends BaseError>(error: E): Fail<E> {
	return new Fail(error)
}

export async function wrapPromise<T>(
	promise: Promise<T>,
): Promise<Result<T, UnknownError>> {
	try {
		const result = await promise
		return success(result)
	} catch (e) {
		return fail(new UnknownError("不明なエラー", e))
	}
}
