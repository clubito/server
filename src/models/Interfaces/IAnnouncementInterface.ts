import mongoose from "mongoose";
import { ClubDocument } from "../Club";

export interface AnnouncementInterface {
    club: mongoose.Schema.Types.ObjectId | ClubDocument,
    timestamp: Date,
    message: string
}