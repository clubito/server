import logger from "@logger";
import { Request, Response } from "express";
import Club from "@models/Club";
import { CLUB_ROLE, CLUB_TAGS } from "@models/enums";

export const searchClubByName = (req: Request, res: Response): void => {
    if (req.query.name === undefined) {
        res.status(400).json({
            error: "Missing club name field"
        });
        return;
    }

    if (!req.userId) {
        res.status(500).json({
            error: "Missing user id. Need to log in first"
        });
        return;
    }
    // if sortBy query is empty or ="Default" then sort by default
    let sortBy = "-createdAt"; //default option
    if (req.query.sortBy && String(req.query.sortBy).toLowerCase() !== "default") {
        sortBy = String(req.query.sortBy);
    }

    // get user id 
    const userId = req.userId;
    const returnFields = "_id name logo description members";   // only return these fields when query database

    const filterOptions = {};

    // search by name
    const clubName = String(req.query.name);
    if (clubName !== "") {
        filterOptions["name"] = {
            $regex: clubName,
            $options: "i"
        };
    }

    // filter by tags
    if (req.query.filter) {
        let tagsList: string[] = (req.query as any).filter;
        tagsList = tagsList.map(x => x.toUpperCase());  // convert all to uppercase to match enum
        // check if the tag exist in the enum or not, if not then return error
        for (const tag of tagsList) {
            if (!(tag in CLUB_TAGS)) {
                res.status(500).json({
                    error: `Tag '${tag}' is not available`
                });
                return;
            }
        }
        filterOptions["tags"] = {
            $in: tagsList   // use $in for "OR", use $all for "AND"
        };
    }

    Club.find(filterOptions, returnFields).populate({
        path: "members",
    }).sort(sortBy).then(clubs => {
        res.status(200).json({
            result: clubs.map(club => {
                // check if the current userId is currently in the club members or not
                // if not, then return role NONMEMBER
                let userClubRole: string = CLUB_ROLE.NONMEMBER;
                for (const member of club.members) {
                    if (String(member.member) === userId) {
                        userClubRole = member.role;
                        break;
                    }
                }
                return {
                    "id": club._id,
                    "name": club.name,
                    "logo": club.logo,
                    "description": club.description,
                    "role": userClubRole
                };
            })
        });
        return;
    }).catch(err => {
        logger.error(err);
        res.status(500).json({
            error: err
        });
        return;
    });
};