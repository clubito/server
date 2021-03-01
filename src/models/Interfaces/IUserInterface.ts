import mongoose from "mongoose";
import { ClubDocument } from "../Club";

export interface IUserInterface extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    isDisabled: boolean;
    isConfirmed: boolean;
    profilePicture: string;
    clubs: {type: mongoose.Schema.Types.ObjectId, role: string}[] | ClubDocument[],
    joinRequests: {type: mongoose.Schema.Types.ObjectId, status: string}[] | ClubDocument[]
}