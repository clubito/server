import mongoose from "mongoose";
import {IAnnouncementInterface} from "./Interfaces/IAnnouncementInterface";


export type IAnnouncement = IAnnouncementInterface

const announcementSchema = new mongoose.Schema<IAnnouncement>(
    {
        club: {type: mongoose.Schema.Types.ObjectId, ref: "Club"},
        timestamp: {type: Date, default: Date.now},
        message: String
    },
    { timestamps: true },
);

const Announcement = mongoose.model<IAnnouncement>("Announcement", announcementSchema);

export default Announcement;