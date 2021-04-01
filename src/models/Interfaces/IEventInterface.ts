import mongoose from "mongoose";
import { IClub } from "../Club";
import { IUser } from "@models/User";

export interface IEventInterface extends mongoose.Document {
    name: string,
    description: string,
    startTime: Date,
    endTime: Date,
    longitude: number,
    latitude: number,
    shortLocation: string,
    picture: string,
    club: mongoose.Schema.Types.ObjectId | IClub,
    lastUpdated: Date,
    rsvpUsers: mongoose.Schema.Types.ObjectId[] | IUser[]
}