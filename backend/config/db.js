import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `✅ Database connection successful`,
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log(`❌ Error while connecting database`, error);
  }
};

export default connectDB;
