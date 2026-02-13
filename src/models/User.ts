import mongoose, { Schema } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../interfaces/User';
import bcrypt from 'bcryptjs';

const UserSchema: Schema = new Schema(
	{
		username: { type: String, required: true, unique: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
	},
	{
		timestamps: true,
	},
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	return await bcrypt.compare(candidatePassword, this.password);
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
