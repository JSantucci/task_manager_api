import { Document } from 'mongoose';

export interface IRefreshToken {
	tokenHash: string;
	createdAt: Date;
	expiresAt: Date;
	revoked?: boolean;
	replacedByTokenHash?: string | null;
	ip?: string | null;
	userAgent?: string | null;
}

export interface IUser extends Document {
	username: string;
	email: string;
	password: string;
	refreshTokens?: IRefreshToken[];
	comparePassword(candidatePassword: string): Promise<boolean>;
	createRefreshToken(options?: { ip?: string; userAgent?: string }): {
		token: string;
		tokenHash: string;
	};
	rotateRefreshToken(
		oldTokenHash: string,
		options?: { ip?: string; userAgent?: string },
	): { token: string; tokenHash: string } | null;
	revokeRefreshToken(tokenHash: string): boolean;
	findValidRefreshToken(tokenHash: string): IRefreshToken | null;
}
