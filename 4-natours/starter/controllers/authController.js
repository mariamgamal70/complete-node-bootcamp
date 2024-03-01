const { promisify } = require('util');
const crypto = require('crypto');
const userModel = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const appError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  //{id:newUser._id} is the payload (data we need)
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // CONVERT TIME FROM DAYS TO MILLISECCONDS
    httpOnly: true, //cookie cannot be modified in any way in the browser, it just recieves cookie and store it and send it automatically along with every request
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions); //to send a cookie , attach it to the response obj,then the parameters are the name of the token , data we want to send (token itself), object that contains options for the cookie
  user.password = undefined; //we do this so that response returned doesnt show the password on creating new acc
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //allow only the data that we actually need to be put into the new user (so that the user cant make himself the admin)
  const newUser = await userModel.create(req.body);
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  //1) check if email and pass exist
  if (!email || !password) {
    return next(new appError('Please provide email and password', 400));
  }
  //2) check if user exists and password is correct
  const user = await userModel.findOne({ email: email }).select('+password'); //select + is used to show hidden entity
  //to compare the password with the encrypted password on DB then encrypt the req pass and compare it with the encrypted one is DB , the function created to do so is found in usermodel as it's related to the data. that function is called correctpassword
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('Incorrect email or password'), 401);
  }
  //3) if everything is okay , send token to client
  createSendToken(user, 200, res);
});

//middleware function to check if user is signed in before entering any protected routes
exports.protect = catchAsync(async (req, res, next) => {
  //1)get token and check if its there
  let token;
  console.log(req.headers.authorization);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(req.headers.authorization);
  if (!token) {
    return next(
      new appError('you are not logged in! please log in to gain access', 401)
    );
  }
  //2)verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // use promisify to return a promise promisify(jwt.verify) , (token, process.env.JWT_SECRET) is the callback func
  //it returns decoded data (payload of the token (id))
  //3)check if user still exists
  const user = await userModel.findById(decoded.id);
  if (!user) {
    return next(
      new appError(
        'the user belonging to this token does no longer exist ',
        401
      )
    );
  }
  //4)check if user changed passwords after the token  was issued
  //use instance function found in usermodel
  //iat =issued date
  if (user.changedPasswordsAfter(decoded.iat)) {
    return next(
      new appError('user recently changed password, please log in again', 401)
    );
  }
  //5)give access to protected route
  req.user = user; // req is helpful in passing info from one middleware to another
  next();
});

//to pass in arguments in middleware you should create a wrapper function that returns the middleware function we want to create
//u can send an arbitary number of roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array : ['admin','lead-guide']
    //if current signed in user role is not in the roles
    if (!roles.includes(req.user.role)) {
      return next(
        new appError('you do not have permission to perform this action ', 403)
      ); //403 means forbidden
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)get user based on POST'ed email
  //findone because the user doesnt have the id , he just has his email
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return next(new appError('theres no user with that email', 404)); //404 means not found
  }
  //2)generate the random token not jwt  (will be done using an instance method in user model)
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //if you save without passing the validate false special option it would cause an error as it would validate all fields from email to pasword and everything . so in order for it to work you should disable all validations before saving. it would save the ecrypted reset token in database
  //3)send it (random token) to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `forgot ur pass? submit a patch req with ur new pass and pass confirm to : ${resetURL}.\n if u didnt forget ur pass pls ignore ur email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'your pass reset token(Valid for 10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new appError('there was an error sending an email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)get user based on token (token sent in the url is not hashed but the token saved in the DB is hashed) therefore we need to encrypt the original token and compare it with the one encrypted in DB
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await userModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); // checks if reset token has expired or no
  //2)if token has not yet expired, and there is user , set the new password
  if (!user) {
    return next(new appError('Token is invalid or has expired', 400));
  }
  //3)update changedPasswordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); //no need to turn of validators because we need to validate in this case pass=passconf thats why save is used not update
  //4)log the user in , send jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)get user from the collection
  const user = await userModel.findById(req.user.id).select('+password'); // user is authorized to change his password if he's already logged in
  //u cant use findbyidandupdate because it would then turn off all the validators that u need in this case
  //2)check if entered old password is correct (POSTed password)
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new appError('invalid password', 401)); //401 is unauthorized
  }
  //3)if correct, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4)log user in, send JWT
  createSendToken(user, 200, res);
});
