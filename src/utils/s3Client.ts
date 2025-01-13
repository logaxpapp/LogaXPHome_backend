// src/utils/s3Client.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

import mongoose from'mongoose';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export const uploadImageToS3 = async (base64Image: string, referenceId: mongoose.Types.ObjectId): Promise<string> => {
  const bucketName = process.env.AWS_S3_BUCKET as string;

  if (!base64Image.startsWith('data:image/')) {
    throw new Error('Invalid image format');
  }

  // Extract the image type and data
  const [, imageType] = base64Image.split(';')[0].split('/');
  const imageData = base64Image.split(',')[1];
  const buffer = Buffer.from(imageData, 'base64');

  const key = `signatures/${referenceId}/${uuidv4()}.${imageType}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: `image/${imageType}`,
    ACL: 'public-read', // Change to 'private' if stricter access is needed
  });

  await s3Client.send(command);

  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};


export default s3Client;
