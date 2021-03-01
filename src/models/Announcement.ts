import mongoose from "mongoose";
import {AnnouncementInterface} from "./Interfaces/AnnouncementInterface";

export type AnnouncementDocument = mongoose.Document & AnnouncementInterface;

const announcementSchema = new mongoose.Schema<AnnouncementDocument>(
    {
        club: {type: mongoose.Schema.Types.ObjectId, ref: "Club"},
        timestamp: Date,
        message: String
    },
    { timestamps: true },
);

export const Announcement = mongoose.model<AnnouncementDocument>("Announcement", announcementSchema);