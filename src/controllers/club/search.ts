import logger from "@logger";
import { Request, Response } from "express";
import Club from "@models/Club";
import User from "@models/User";
import { CLUB_ROLE } from "@models/enums";

export const searchClubByName = (req: Request, res: Response): void => {
    if (!req.query || !req.query.name) {
        res.status(400).json({
            error: "Missing club name field"
        })
        return;
    }

    if (!req.userId) {
        res.status(500).json({
            error: "Missing user id. Need to log in first"
        })
        return;
    }
    // if sortBy query is empty or ="Default" then sort by default
    let sortBy = "-createdAt"; //default option
    if (req.query.sortBy && String(req.query.sortBy).toLowerCase() !== "default") {
        sortBy = String(req.query.sortBy);
    }

    // get user id 
    const userId = req.userId;
    const clubName: string = String(req.query.name);
    Club.find({ name: { $regex: clubName, $options: "i" } }, "_id name logo description members").populate({
        path: "members",
    }).sort(sortBy).then(clubs => {
        logger.debug(clubs);
        res.status(200).json({
            message: "Query the clubs successfully",
            result: clubs.map(club => {
                // check if the current userId is currently in the club members or not
                // if not, then return role NONMEMBER
                let userClubRole: string = CLUB_ROLE.NONMEMBER;
                for (let member of club.members) {
                    if (String(member.member) === userId) {
                        userClubRole = member.role;
                        break;
                    }
                }
                return {
                    "_id": club._id,
                    "name": club.name,
                    "logo": club.logo,
                    "description": club.description,
                    "role": userClubRole
                }
            })
        })
        return;
    }).catch(err => {
        logger.error(err);
        res.status(500).json({
            err
        })
        return;
    })

    if (req.query.filter) {
        const filterArray: any[] = (req.query as any).filter;
        logger.debug(filterArray);
    }
}