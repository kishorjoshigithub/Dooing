import User from "../models/user.model.js";
import { errorHandler } from "./utils/error.js";

//@ desc   Register a new user
//@ route POST /api/auth/sign-up
//@ Public
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, profileImageUrl, adminJoinCode } = req.body;

    //check if all fields are filled
    if (!name || !email || !password) {
      return next(errorHandler(400, "Please fill all required fields"));
    }

    const isAlreadyExist = await User.findOne({ email });
    if (isAlreadyExist) {
      return next(errorHandler(400, "User with this email already exists"));
    }

    //check user role
    let role = "user";
    if (adminJoinCode && adminJoinCode === process.env.ADMIN_JOIN_CODE) {
      role = "admin";
    }

    const newUser = new User({
      name: name,
      email: email,
      password: password,
      profileImageUrl: profileImageUrl || "",
      role: role,
    });

    const user = await newUser.save();

    const SavedUser = await User.findById(newUser._id).select("-password");

    res.status(201).json({
      message: "User registered successfully",
      SavedUser,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
