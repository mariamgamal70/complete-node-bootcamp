const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const userRouter = express.Router();

//routes that do not need protection
userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

//since middleware runs always in sequence and the following routes are not protected but needs to be protected (aka user must be logged in), we can use middleware on userRouter instead of adding a middleware to each of the following routes (authController.protect)
userRouter.use(authController.protect); //it'll only go to the next middleware if the user is authenticated

//routes that need protection
userRouter.patch('/updateMyPassword', authController.updatePassword); // protect because it should be done on logged in users only
userRouter.get('/me', userController.getMe, userController.getUser); // route for the user to get his own data, since we dont want code repetition, its going to be the same function as getOne but instead of geting id from the route, we get it from the current logged in user, therefore we use a middleware getMe To fake that the req.params.id = req.user.id;
userRouter.patch('/updateMe', userController.updateMe);
userRouter.delete('/deleteMe', userController.deleteMe);

userRouter.use(authController.restrictTo('admin'));
// routes that only admin can access
userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
