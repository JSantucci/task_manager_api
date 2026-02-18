import mongoose, { Schema } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import type { IUser, IRefreshToken } from '../interfaces/User';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);

const UserSchema: Schema = new Schema(
	{
		username: { type: String, required: true, unique: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		refreshTokens: [
			{
				tokenHash: { type: String, required: true },
				createdAt: { type: Date, required: true },
				expiresAt: { type: Date, required: true },
				revoked: { type: Boolean, default: false },
				replacedByTokenHash: { type: String, default: null },
				ip: { type: String, default: null },
				userAgent: { type: String, default: null },
			},
		],
	},
	{
		timestamps: true,
	},
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Create and store a new refresh token for the user. Returns the plain token string.
UserSchema.methods.createRefreshToken = function (
	this: HydratedDocument<IUser>,
	options?: { ip?: string; userAgent?: string },
) {
	const token = crypto.randomBytes(64).toString('hex');
	const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
	const now = new Date();
	const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
	const record: IRefreshToken = {
		tokenHash,
		createdAt: now,
		expiresAt,
		revoked: false,
		replacedByTokenHash: null,
		ip: options?.ip ?? null,
		userAgent: options?.userAgent ?? null,
	};
	if (!this.refreshTokens) this.refreshTokens = [] as unknown as IRefreshToken[];
	this.refreshTokens.push(record);
	return { token, tokenHash };
};

UserSchema.methods.rotateRefreshToken = function (
	this: HydratedDocument<IUser>,
	oldTokenHash: string,
	options?: { ip?: string; userAgent?: string },
) {
	// mark old token revoked and set replacedByTokenHash
	// const now = new Date();
	const found = this.refreshTokens?.find((t: IRefreshToken) => t.tokenHash === oldTokenHash);
	if (!found) return null;
	found.revoked = true;
	const { token, tokenHash } = this.createRefreshToken(options);
	found.replacedByTokenHash = tokenHash;
	return { token, tokenHash };
};

UserSchema.methods.revokeRefreshToken = function (
	this: HydratedDocument<IUser>,
	tokenHash: string,
) {
	const found = this.refreshTokens?.find((t: IRefreshToken) => t.tokenHash === tokenHash);
	if (!found) return false;
	found.revoked = true;
	return true;
};

UserSchema.methods.findValidRefreshToken = function (
	this: HydratedDocument<IUser>,
	tokenHash: string,
) {
	const now = new Date();
	const found = this.refreshTokens?.find(
		(t: IRefreshToken) => t.tokenHash === tokenHash && !t.revoked && t.expiresAt > now,
	);
	return found ?? null;
};

UserSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform: function (doc, ret) {
		ret.id = ret._id;
		delete ret._id;
	},
});

UserSchema.pre('save', async function (this: HydratedDocument<IUser>) {
	if (this.isModified('password')) {
		const salt = await bcrypt.genSalt();
		const hash = await bcrypt.hash(this.password, salt);
		this.password = hash;
	}
});

export default mongoose.model<IUser>('User', UserSchema);
