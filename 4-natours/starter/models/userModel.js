const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
//name,email,photo,password,password confirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please enter a name'],
  },
  email: {
    type: String,
    required: [true, 'please enter an email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'please enter a valid email'], // custom validator to check if its format is an email (npm package)
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'please enter a password'],
    minlength: 8,
    select: false, // password should not be shown in the database
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password; // el is passwordconfirm , password is the current user password
        //if returns false then a validation error is going to appear
      }, //callback function
      message: 'Passwords are not the same',
    }, //custom validator WORKS ONLY ON CREATE AND SAVE! NOT ON EACH UPDATE
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date, //security measure for reset token
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// to encrypt passwords , it should be a model middleware before saving
//only run this function if password was actually modified
userSchema.pre('save', async function (next) {
  //DONT USE ARROW FUNCTION IF YOURE GOING TO USE KEYWORD "THIS"
  if (!this.isModified('password')) {
    return next();
  }
  //encryption or hashing method called bcrypt works against brute force attacks (npm package)
  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12); //bycrpt.hash is async func
  //we just needed password confirm for validation after that we dont need it therefore we delete it
  //password confirm is required input but doesnt mean its required to persist to database
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //putting it 1 sec in the past so that the user could login before changing the date of passchanged ,as user login could be faster than updating this value , ensures that the token is always created after changing the password
  next();
});

userSchema.pre(/^find/, function (next) {
  //words or strings that start with find (regular expression)
  this.find({ active: { $ne: false } }); //doesnt show all the deleted users in using find (postman) meanwhile it shows all users deleted or not deleted in the database itself(mongodb)
  next();
});

//instance method ,method that is available on all user documents or a certain collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //this.password wont work here anymore as we made password select:false (not visible)
  //candidate pass is not hashed (original pass from user), userpassword is hashed
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordsAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; //check if password was changed after token was issued
  }
  return false; // no change happened by default
};

//token needs to be a randomstring but doesnt have to be cryptographically strong as jwt therefore use built in crypto module
userSchema.methods.createPasswordResetToken = function () {
  //1)create token
  const resetToken = crypto.randomBytes(32).toString('hex');
  //although it doesnt have to be as strongly crypted as passwords but it needs to be encrypted too because if a hacker accesses the database and is able to access that token he could reset and change the pass by himself
  //2)encrypt token
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //convert 10min to milliseconds
  return resetToken; //should be sent to email
};
//model middle wares shall be placed before creation of model

const userModel = mongoose.model('users', userSchema);

module.exports = userModel;
