import mongoose from "mongoose";
import { UserInterface } from "./Interfaces/UserInterface";
import { CLUB_ROLE, JOIN_REQUEST_STATUS } from "./enums";
import { SALT_ROUNDS } from "@secrets"; 
import bcrypt from "bcrypt";

const saltRounds = SALT_ROUNDS;

export type UserDocument = mongoose.Document & UserInterface;

const userSchema = new mongoose.Schema<UserDocument>(
    {
        name: String,
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        isDisabled: Boolean,
        isConfirmed: {type: Boolean, default: false},
        profilePicture: String,
        clubs: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Club",
                role: {type: String, enum: CLUB_ROLE}
        }],
        joinRequests: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            status: {type: String, enum: JOIN_REQUEST_STATUS}
        }]
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

userSchema.methods.validatePassword = async function validatePassword(data) {
    return bcrypt.compare(data, this.password);
};


const User = mongoose.model<UserDocument>("User", userSchema);

export default User;