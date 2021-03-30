import mongoose from "mongoose";
import { IUserInterface } from "./Interfaces/IUserInterface";
import { CLUB_ROLE, JOIN_REQUEST_STATUS, APP_ROLE, CLUB_TAGS } from "./enums";
import { SALT_ROUNDS } from "@secrets";
import bcrypt from "bcrypt";
import { uid } from "uid";

const saltRounds = SALT_ROUNDS;

export interface IUser extends IUserInterface {
    validatePassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
    {
        name: { type: String, default: "" },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isDisabled: { type: Boolean, default: false },
        isConfirmed: { type: Boolean, default: false },
        profilePicture: { type: String, default: "https://picsum.photos/200" },
        clubs: [{
            club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
            role: { type: String, enum: CLUB_ROLE },
            approvalDate: { type: Date, default: Date.now }
        }],
        joinRequests: [{
            club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
            status: { type: String, enum: JOIN_REQUEST_STATUS },
            requestedAt: { type: Date, default: Date.now }
        }],
        appRole: { type: String, enum: APP_ROLE, default: APP_ROLE.MEMBER },
        secret: { type: String, default: "" },
        clubTags: [{ type: String, enum: CLUB_TAGS }],
        banned: { type: Boolean, default: false },
        pushToken: { type: String, default: "" },
        bio: { type: String, default: "" }
    },
    { timestamps: true },
);

userSchema.pre("save", async function save(next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        // generate a magic link with the user's unique email 
        const uidToken = uid(16);
        this.secret = uidToken;
        return next();
    } catch (err) {
        return next(err);
    }
});

userSchema.methods.validatePassword = async function validatePassword(password) {
    return bcrypt.compare(password, this.password);
};


const User = mongoose.model<IUser>("User", userSchema);

export default User;