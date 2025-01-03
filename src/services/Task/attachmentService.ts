import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';



// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS Access Key ID
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Access Key
    region: process.env.AWS_REGION || 'us-east-1', // Your AWS Region
  });
  
  /**
   * Upload a file to S3
   * @param file - Multer file object
   */
  export const uploadFileToS3 = async (file: Express.Multer.File): Promise<{ url: string; key: string }> => {
    const fileKey = `${uuidv4()}_${file.originalname}`; // Generate a unique key for the file
  
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || 'logaxpbucket', // Replace with your bucket name
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
  
    try {
      const uploadResult = await s3.upload(params).promise();
      return { url: uploadResult.Location, key: uploadResult.Key };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  };
  
  /**
   * Delete a file from S3
   * @param key - S3 file key
   */
  export const deleteFileFromS3 = async (key: string): Promise<void> => {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME || 'logaxpbucket', // Replace with your bucket name
      Key: key,
    };
  
    try {
      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  };