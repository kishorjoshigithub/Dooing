import User from "../models/user.model.js";
import { errorHandler } from "../middlewares/error.middleware.js";
import jwt from "jsonwebtoken";

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

//@ desc   Login user
//@ route POST /api/auth/sign-in
//@ Public
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // check if all fields are filled
    if (!email || !password) {
      return next(errorHandler(400, "Please fill all required fields"));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(errorHandler(400, "Invalid email or password"));
    }

    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) {
      return next(errorHandler(400, "Login failed! Invalid credentials"));
    }

    //generate jwt token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRETKEY, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const LoggedInUser = await User.findById(user._id).select("-password");
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    };

    res.status(200).cookie("access_token", token, options).json({
      message: "Login successful",
      LoggedInUser,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//@ desc Profile
//@ route GET /api/auth/user-profile
//@ Private
export const userProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const LoggedInUser = await User.findById(user._id).select("-password");
    if (!LoggedInUser) {
      return next(errorHandler(404, "User not found"));
    }
    res.status(200).json({
      message: "Profile fetched successfully",
      LoggedInUser,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//@ desc   Update user profile
//@ route PUT /api/auth/update-profile
//@ Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.password = req.body.password || user.password;
    user.profileImageUrl = req.body.profileImageUrl || user.profileImageUrl;

    const updatedUser = await user.save({ validateBeforeSave: false });
    const SafeUser = await User.findById(updatedUser._id).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      SafeUser,
    });
  } catch (error) {
    next(error);
  }
};
