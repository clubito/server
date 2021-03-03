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
    joinRequests: mongoose.Schema.Types.ObjectId[] | IUser[],
    announcements: mongoose.Schema.Types.ObjectId[] | IAnnouncement[],
    roles: {user: mongoose.Schema.Types.ObjectId, customTitle: string},
    theme: string
}