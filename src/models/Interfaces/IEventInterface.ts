import mongoose from "mongoose";
import { IClub } from "../Club";

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
    lastUpdated: Date
}