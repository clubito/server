import mongoose from "mongoose";
import { UserInterface } from "./Interfaces/UserInterface";
import { CLUB_ROLE, JOIN_REQUEST_STATUS } from "./enums";


export type UserDocument = mongoose.Document & UserInterface;

const userSchema = new mongoose.Schema<UserDocument>(
    {
        name: String,
        email: {type: String, required: true},
        password: {type: String, required: true},
        isDisabled: Boolean,
        isConfirmed: Boolean,
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

export const User = mongoose.model<UserDocument>("User", userSchema);