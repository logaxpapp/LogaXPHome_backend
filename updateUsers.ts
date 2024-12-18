import bcrypt from 'bcrypt';
import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const defaultPassword = 'default123';
const dbName = 'service-desk';

const updatePasswords = async () => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    const cursor = users.find({ password_hash: { $exists: false } });

    while (await cursor.hasNext()) {
      const user = await cursor.next();

      if (user) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(defaultPassword, salt);

        await users.updateOne(
          { _id: user._id },
          { $set: { password_hash: hash } }
        );

        console.log(`Updated user: ${user._id}`);
      }
    }

    console.log('All users updated!');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await client.close();
  }
};

updatePasswords();
