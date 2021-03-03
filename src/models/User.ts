import mongoose from "mongoose";
import { IUserInterface } from "./Interfaces/IUserInterface";
import { CLUB_ROLE, JOIN_REQUEST_STATUS, APP_ROLE } from "./enums";
import { SALT_ROUNDS } from "@secrets"; 
import bcrypt from "bcrypt";

const saltRounds = SALT_ROUNDS;

export interface IUser extends IUserInterface {
    validatePassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
    {
        name: String,
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        isDisabled: {type: Boolean, default: false},
        isConfirmed: {type: Boolean, default: false},
        profilePicture: String,
        clubs: [{
                club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
                role: { type: String, enum: CLUB_ROLE }
        }],
        joinRequests: [{
            club: { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
            status: { type: String, enum: JOIN_REQUEST_STATUS }
        }],
        appRole: { type: String, enum: APP_ROLE }
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