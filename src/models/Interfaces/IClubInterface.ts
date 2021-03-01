import mongoose from "mongoose";
import { IUser } from "../User";
import { EventDocument } from "../Event";

export interface ClubInterface {
    name: string,
    logo: string,
    description: string,
    members: mongoose.Schema.Types.ObjectId[] | IUser[],
    events: mongoose.Schema.Types.ObjectId[] | EventDocument[],
    joinRequests: mongoose.Schema.Types.ObjectId[] | IUser[],
    roles: string,
    theme: string
}