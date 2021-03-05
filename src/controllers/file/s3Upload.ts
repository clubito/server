import { Request, Response } from "express";
import { getPresignedUrl } from "../../util/aws_s3";

export const getS3PresignedUrl = (req: Request, res: Response): void => {
    const url: string = getPresignedUrl();
    res.status(200).json({
        message: "Get S3 presigned url successful",
        presignedUrl: url
    });

};
