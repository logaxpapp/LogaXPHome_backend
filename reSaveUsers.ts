import mongoose from 'mongoose';
import User from './src/models/User';

(async () => {
  await mongoose.connect('mongodb://localhost:27017/service-desk');
  const users = await User.find();

  for (const user of users) {
    console.log(`Re-saving user: ${user.email}`);
    await user.save(); // Triggers schema reattachment
  }

  console.log('All users re-saved successfully');
  await mongoose.disconnect();
})();
