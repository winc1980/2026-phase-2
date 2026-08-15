import { BaseError } from "~/lib/error"

export class RepositoryError extends BaseError {
	name = "RepositoryError"
}

export class UserNotFoundError extends BaseError {
	name = "UserNotFoundError"
}

export class UserMailAlreadyExistsError extends BaseError {
	name = "UserMailAlreadyExistsError"
}

export class PasswordConfirmationMismatchError extends BaseError {
	name = "PasswordConfirmationMismatchError"
}

export class InvalidPasswordError extends BaseError {
	name = "InvalidPasswordError"
}

export class InvalidSessionTokenError extends BaseError {
	name = "InvalidSessionTokenError"
}

export class ExpiredSessionTokenError extends BaseError {
	name = "ExpiredSessionTokenError"
}
