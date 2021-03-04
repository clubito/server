import mongoose from "mongoose";
import { IUser } from "../User";
import { IAnnouncement } from "../Announcement";
import { IEvent } from "../Event";

export interface IClubInterface extends mongoose.Document {
    name: string,
    logo: string,
    description: string,
    members: mongoose.Schema.Types.ObjectId[] | IUser[],
    events: mongoose.Schema.Types.ObjectId[] | IEvent[],
    joinRequests: {
        user: mongoose.Schema.Types.ObjectId,
        status: string,
        requestedAt: Date
    }[] | {
        user: IUser,
        status: string,
        requestedAt: Date
    }[],
    announcements: mongoose.Schema.Types.ObjectId[] | IAnnouncement[],
    roles: { user: mongoose.Schema.Types.ObjectId, customTitle: string },
    theme: string,
    tags: string[]
}