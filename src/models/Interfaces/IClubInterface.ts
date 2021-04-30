import mongoose from "mongoose";
import { IUser } from "../User";
import { IAnnouncement } from "../Announcement";
import { IEvent } from "../Event";
import { IMessage } from "@models/Message";
import { IRole } from "@models/Role";

export interface IClubInterface extends mongoose.Document {
    name: string,
    logo: string,
    description: string,
    members: {
        member: mongoose.Schema.Types.ObjectId,
        role: string,
        role2: mongoose.Schema.Types.ObjectId
    }[]
    | {
        member: IUser,
        role: string,
        role2: mongoose.Schema.Types.ObjectId
    }[]
    | {
        member: IUser,
        role: string,
        role2: IRole

    }[],
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
    roles: mongoose.Schema.Types.ObjectId[] | IRole[],
    theme: string,
    tags: string[],
    isEnabled: boolean,
    deleted: {
        isDeleted: boolean,
        deletedAt: Date | null
    },
    messages: mongoose.Schema.Types.ObjectId[] | IMessage[],
    pictures: string[]
}