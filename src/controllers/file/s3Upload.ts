import { Request, Response } from "express";
import { getPresignedUrl } from "../../util/aws_s3";

export const getS3PresignedUrl = (req: Request, res: Response): void => {
    if (req.params.filename) {
        const filename: string = req.params.filename;
        const url: string = getPresignedUrl(filename);
        res.status(200).json({
            message: "Get S3 presigned url successful",
            presignedUrl: url
        });
    } else {
        res.status(400).json({ error: "Filename is not specified" });
    }
};
