import mongoose from "mongoose";
import { ClubDocument } from "../Club";

export interface EventInterface {
    name: string,
    description: string,
    startTime: Date,
    endTime: Date,
    longitude: number,
    latitude: number,
    shortLocation: string,
    picture: string,
    club: mongoose.Schema.Types.ObjectId | ClubDocument,
    lastUpdated: Date
}