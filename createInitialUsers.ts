import mongoose from 'mongoose';
import User from './src/models/User';
import bcrypt from 'bcrypt';

const DATABASE_URL =
  'mongodb+srv://admin:LogaXP%402024@cluster0.gnxxepv.mongodb.net/service-desk?retryWrites=true&w=majority';

// Connect to the cloud-based MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(DATABASE_URL); // Updated to remove deprecated options
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Create the initial admin user
const createAdminUser = async () => {
  const adminData = {
    name: 'John First',
    email: 'john@gmail.com',
    role: 'admin',
    status: 'Active',
    password_hash: '',
  };

  try {
    const salt = await bcrypt.genSalt(10);
    adminData.password_hash = await bcrypt.hash('Abiodun@1', salt);

    const admin = new User(adminData);
    await admin.save();

    console.log('Admin user created:', admin);
  } catch (error) {
    console.error('Failed to create admin user:', error);
  }
};

// Create an active user
const createActiveUser = async () => {
  const userData = {
    name: 'Gerald Emeka',
    email: 'gerry@gmail.com',
    role: 'admin',
    status: 'Active',
    password_hash: '',
  };

  try {
    const salt = await bcrypt.genSalt(10);
    userData.password_hash = await bcrypt.hash('Password@123', salt);

    const user = new User(userData);
    await user.save();

    console.log('Active user created:', user);
  } catch (error) {
    console.error('Failed to create active user:', error);
  }
};

// Run the script
const runScript = async () => {
  await connectToDatabase();
  await createAdminUser();
  await createActiveUser();
  mongoose.disconnect();
};

runScript();
