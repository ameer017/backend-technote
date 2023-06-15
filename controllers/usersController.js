const User = require("../models/User");
const Note = require("../models/Note");

const bcrypt  = require('bcrypt')
const asyncHandler = require("express-async-handler");

const getAllUsers = asyncHandler(async (req, res) => {
  // Get all users from MongoDB
  const users = await User.find().select("-password").lean();

  // If no users
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }

  res.status(200).json(users);
});

const createNewUser = asyncHandler(async (req, res) => {
  const {username, password, roles } = req.body

  // confirm data
  if(!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({message: 'All fields must be provided'})
  }
  // check for duplicate
  const duplicate = await User.findOne({username}).lean().exec()
  if(duplicate) {
    return res.status(409).json({message: 'User already exist'})
  }

  // hash password
  const hashPwd = await bcrypt.hash(password, 10);
  const userObject = {
    username, password: hashPwd, roles
  }

  // create user 
  const user = await User.create(userObject)
  if(user) {
    res.status(201).json({message: `new user ${username} created successfully`})
  }else{
    res.status(400).json({message: 'user already exist'})
  }
});

const updateUser = asyncHandler(async (req, res) => {
  // destructure the data the request will receive
  const { id, username, password, roles, active } = req.body;

  // Confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res
      .status(400)
      .json({ message: "All fields are required except password" });
  }
  // Does the user exist to update?
  const user = await User.findById(id).exec();
  if (!user) return res.status(400).json({ message: "User Not Found" });

  // Check for duplicate
  const duplicate = await User.findOne({ username }).lean().exec();
  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id)
    return res.status(400).json({ message: "Duplicate User" });

  //three fields to be updated
  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    user.password = await bcrypt.hash(password); // salt rounds
  }

  const updatedUser = await user.save();
  res.json({ message: `User ${updatedUser} has been updated` });
});


const deleteUser = asyncHandler(async (req, res) => {
  const {id} = req.body
  if(id){
    return res.status(400).json({message: 'user id required'})
  }

  const notes = await Note.findOne({user: id}).lean().exec()

  if(notes.length) {
    return res.status(400).json({message: 'user assigned note'})
  }

  const user = await User.findById(id).exec()
  if(user) {
    return res.status(400).json({message: 'user not found'})
  }

  const result = await user.deleteOne()
  const response = `username ${result.username} with id: ${result._id} deleted`

  res.json(response)
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
