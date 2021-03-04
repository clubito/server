import AWS from "aws-sdk";
import { AWS_KEY, AWS_SECRET, BUCKET_REGION, BUCKET_NAME } from "../util/secrets";
AWS.config.update({ accessKeyId: AWS_KEY, secretAccessKey: AWS_SECRET, region: BUCKET_REGION });
const s3 = new AWS.S3();

export const getPresignedUrl = function (filename: string) {
    const signedUrlExpireSeconds = 60; // 1 minute

    const url = s3.getSignedUrl("putObject", {
        Bucket: BUCKET_NAME,
        Key: filename,
        Expires: signedUrlExpireSeconds,
    });

    return url;
};