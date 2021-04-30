import mongoose from "mongoose";
import { IClub } from "../Club";
import { IEvent } from "@models/Event";
import { IRole } from "@models/Role";

export interface IUserInterface extends mongoose.Document {
    name: string;
    email: string;
    password: string;
    isDisabled: boolean;
    isConfirmed: boolean;
    profilePicture: string;
    clubs: { club: mongoose.Schema.Types.ObjectId, role: string, approvalDate: Date, role2: mongoose.Schema.Types.ObjectId }[]
    | { club: IClub, role: string, approvalDate: Date, role2: mongoose.Schema.Types.ObjectId }[]
    | { club: mongoose.Schema.Types.ObjectId, role: string, approvalDate: Date, role2: IRole }[]
    | { club: IClub, role: string, approvalDate: Date, role2: IRole }[],
    joinRequests: {
        club: mongoose.Schema.Types.ObjectId,
        status: string,
        requestedAt: Date
    }[] | {
        club: IClub,
        status: string,
        requestedAt: Date
    }[],
    appRole: string,
    secret: string,
    clubTags: string[],
    banned: boolean,
    pushToken: string,
    bio: string,
    settings: {
        notifications: {
            enabled: boolean,
            disabledClubs: mongoose.Schema.Types.ObjectId[] | IClub[]
        }
    },
    allRSVP: mongoose.Schema.Types.ObjectId[] | IEvent[],
    deleted: {
        isDeleted: boolean,
        deletedAt: Date | null
    }
}