import mongoose from "mongoose";
import { IClub } from "../Club";

export interface IUserInterface extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    isDisabled: boolean;
    isConfirmed: boolean;
    profilePicture: string;
    clubs: { club: mongoose.Schema.Types.ObjectId, role: string }[] | { club: IClub, role: string }[],
    joinRequests: {
        club: mongoose.Schema.Types.ObjectId,
        status: string,
        requestedAt: Date
    }[] | {
        club: IClub,
        status: string,
        requestedAt: Date
    }[],
    appRole: string,
    secret: string,
    clubTags: string[]
}