import { eq } from "drizzle-orm"
import type { DrizzleDB } from "~/db"
import { type UserTable, userTable } from "~/db/schema"
import {
	RepositoryError,
	UserMailAlreadyExistsError,
} from "~/domain/data/errors"
import type { User } from "~/domain/entities/user"
import { compareHashedPassword, hashPassword } from "~/lib/hash"
import { fail, type Result, success, wrapPromise } from "~/lib/result"

export interface UserRepository {
	getByMail(mail: string): Promise<Result<User | null, RepositoryError>>
	getById(id: number): Promise<Result<User | null, RepositoryError>>
	authenticateWithPassword(
		userId: number,
		password: string,
	): Promise<Result<boolean, RepositoryError>>
	create(params: {
		name: string
		mail: string
		password: string
	}): Promise<Result<User, RepositoryError | UserMailAlreadyExistsError>>
}

export class UserRepositoryImpl implements UserRepository {
	private readonly db: DrizzleDB
	constructor(db: DrizzleDB) {
		this.db = db
	}
	async getById(id: number): Promise<Result<User | null, RepositoryError>> {
		const result = await wrapPromise(
			this.db.select().from(userTable).where(eq(userTable.id, id)).limit(1),
		)
		if (!result.success)
			return fail(new RepositoryError("UserTableの処理が失敗しました"))

		const userRow = result.value[0] as UserTable | undefined

		if (!userRow) return success(null)

		const user: User = {
			id: userRow.id,
			name: userRow.name,
			mail: userRow.mail,
		}

		return success(user)
	}

	async getByMail(mail: string): Promise<Result<User | null, RepositoryError>> {
		const result = await wrapPromise(
			this.db.select().from(userTable).where(eq(userTable.mail, mail)).limit(1),
		)

		if (!result.success)
			return fail(new RepositoryError("UserTableの処理が失敗しました"))

		const userRow = result.value[0] as UserTable | undefined

		if (!userRow) return success(null)

		const user: User = {
			id: userRow.id,
			name: userRow.name,
			mail: userRow.mail,
		}

		return success(user)
	}

	async authenticateWithPassword(userId: number, password: string) {
		const result = await wrapPromise(
			this.db.select().from(userTable).where(eq(userTable.id, userId)).limit(1),
		)

		if (!result.success)
			return fail(new RepositoryError("UserTableの処理が失敗しました"))

		const user = result.value[0] as UserTable | undefined

		if (!user) return success(false)

		const isAuthenticated = await compareHashedPassword(
			password,
			user.passwordHash,
		)

		return success(isAuthenticated)
	}

	async create(params: {
		name: string
		mail: string
		password: string
	}): Promise<Result<User, RepositoryError | UserMailAlreadyExistsError>> {
		const existingResult = await this.getByMail(params.mail)

		if (!existingResult.success) return existingResult

		if (existingResult.value !== null)
			return fail(
				new UserMailAlreadyExistsError(
					`メール「${params.mail}」は既に登録されています`,
				),
			)

		const passwordHash = await hashPassword(params.password)

		const result = await wrapPromise(
			this.db
				.insert(userTable)
				.values({
					name: params.name,
					mail: params.mail,
					passwordHash,
				})
				.returning(),
		)

		if (!result.success) {
			const cause = result.error.cause
			if (
				cause instanceof Error &&
				/UNIQUE constraint failed/.test(cause.message)
			)
				return fail(
					new UserMailAlreadyExistsError(
						`メール「${params.mail}」は既に登録されています`,
					),
				)

			return fail(new RepositoryError("UserTableの処理が失敗しました"))
		}

		const userRow = result.value[0] as UserTable | undefined

		if (!userRow)
			return fail(new RepositoryError("UserTableの処理が失敗しました"))

		const user: User = {
			id: userRow.id,
			name: userRow.name,
			mail: userRow.mail,
		}

		return success(user)
	}
}
