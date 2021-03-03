import mongoose from "mongoose";
import { IClub } from "../Club";

export interface IAnnouncementInterface extends mongoose.Document {
    club: mongoose.Schema.Types.ObjectId | IClub,
    timestamp: Date,
    message: string
}