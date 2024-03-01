const userModel = require('../models/userModel');
const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  //loop through objects and check if its from the allowed fields
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1)create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    next(new appError('this route is not for updating password', 400)); //400 bad request
  }
  const filteredBody = filterObj(req.body, 'name', 'email'); //filtered unwanted field names that are not allowed to be updated
  const updatedUser = await userModel.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    { new: true, runValidators: true }
  ); //we put filteredBody as the updated content because we dont want to update everything we just update certain thing only
  //2)update user document
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await userModel.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await userModel.find();
  res.status(200).json({
    status: 'success',
    data: users,
  });
});

exports.getUser = exports.getTour = handlerFactory.getOne(userModel);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined pls use sign up instead',
  });
};

exports.updateUser = handlerFactory.updateOne(userModel); //update used only by admins , can update anything but not the password (do not attempt to update passwords with this as safe middleware is not being used aka password wont be hashed i guess)

exports.deleteUser = handlerFactory.deleteOne(userModel); //admin can only delete a user but if a user deletes himself , active will turn false instead of true only
