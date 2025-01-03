// src/utils/multerConfig.ts
import multer from 'multer';
import multerS3 from 'multer-s3';
import s3Client from './s3Client';

const s3BucketName = process.env.AWS_S3_BUCKET as string;

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: s3BucketName,
    acl: 'public-read', // or private if you want stricter control
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // e.g. `documents/userId/timestamp_filename`
      const userId = req.user?._id.toString() || 'anonymous';
      const timestamp = Date.now();
      cb(null, `documents/${userId}/${timestamp}_${file.originalname}`);
    },
  }),
});

export default upload;
