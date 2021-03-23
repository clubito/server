import mongoose from "mongoose";
import { IUser } from "../User";
import { IClub } from "../Club";

export interface IMessageInterface extends mongoose.Document {
    author: mongoose.Schema.Types.ObjectId | IUser,
    authorName: string,
    club: mongoose.Schema.Types.ObjectId | IClub,
    timestamp: Date,
    body: string,
    attachment: string
}