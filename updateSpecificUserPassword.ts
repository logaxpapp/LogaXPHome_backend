import bcrypt from 'bcrypt';
import { MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const dbName = 'service-desk';

const updateSpecificUserPassword = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    const userId = new ObjectId('6717e8a888d78b94cd46a3a3'); // Replace with the user's ID
    const newPassword = 'Password123';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await users.updateOne(
      { _id: userId },
      { $set: { password_hash: hashedPassword } }
    );

    if (result.matchedCount > 0) {
      console.log(`User with ID ${userId} password updated successfully.`);
    } else {
      console.error(`User with ID ${userId} not found.`);
    }
  } catch (error) {
    console.error('Error updating user password:', error);
  } finally {
    await client.close();
  }
};

updateSpecificUserPassword();
