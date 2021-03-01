import mongoose from "mongoose";
import { UserDocument } from "../User";
import { EventDocument } from "../Event";

export interface ClubInterface {
    name: string,
    logo: string,
    description: string,
    members: mongoose.Schema.Types.ObjectId[] | UserDocument[],
    events: mongoose.Schema.Types.ObjectId[] | EventDocument[],
    joinRequests: mongoose.Schema.Types.ObjectId[] | UserDocument[],
    roles: string,
    theme: string
}