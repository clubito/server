import { Request, Response } from "express";
import Club from "@models/Club";
import logger from "@logger";
import joi from "joi";

const getClubProfileSchema = joi.object().keys({
    id: joi.required()
});

// interface IReturnedUserProfile {
//     name: string,
//     email: string,
//     clubs: {
//         name: string,
//         description: string,
//         logo: string,
//         role: string
//     }[],
//     joinRequests: {
//         name: string,
//         description: string,
//         logo: string
//         status: string
//     }[],
//     tags: string[]
// }

export const getClubProfile = (req: Request, res: Response): void => {
    const { error } = getClubProfileSchema.validate(req.body);
    if (error) {
        res.status(400).json({ "error": error.message });
        logger.debug(error);
        return;
    }

    const { id } = req.body;

    Club.findOne({ _id: id })
        .populate("members")
        .populate("events")
        .populate("joinRequests")
        .populate("announcements")
        .then(club => {
            if (!club) {
                res.status(400).json({ error: "Club not found" });
                return;
            }
            res.status(200).json({ club });
            return;
        })
        .catch(err => {
            logger.error(err);
            res.status(500).json({ error: err });
            return;
        });
};


// export const putUserProfile = (req: Request, res: Response): void => {
//     const { error } = putUserProfileSchema.validate(req.body);
//     if (error) {
//         res.status(400).json({ "error": error.message });
//         logger.debug(error);
//         return;
//     }

//     const userId = req.userId;

//     User.findOne({ _id: userId })
//         .populate({
//             path: "clubs",
//             populate: { path: "club" }
//         })
//         .populate({
//             path: "joinRequests",
//             populate: { path: "club" }
//         })
//         .then(user => {
//             if (!user) {
//                 res.status(400).json({ error: "User not found" });
//                 return;
//             }

//             const { email, name, profilePicture } = req.body;

//             if (email) {
//                 user.email = email;
//             }
//             if (name) {
//                 user.name = name;
//             }
//             if (profilePicture) {
//                 user.profilePicture = profilePicture;
//             }
//             user.save()
//                 .then(() => {
//                     res.status(200).json({ "message": "Successfully updated user profile" });
//                 });
//         })
//         .catch(err => {
//             logger.error(err);
//             res.status(500).json({ error: err });
//             return;
//         });
// };