import mongoose from "mongoose";
import {AnnouncementInterface} from "./Interfaces/IAnnouncementInterface";

export type AnnouncementDocument = mongoose.Document & AnnouncementInterface;

const announcementSchema = new mongoose.Schema<AnnouncementDocument>(
    {
        club: {type: mongoose.Schema.Types.ObjectId, ref: "Club"},
        timestamp: Date,
        message: String
    },
    { timestamps: true },
);

const Announcement = mongoose.model<AnnouncementDocument>("Announcement", announcementSchema);

export default Announcement;