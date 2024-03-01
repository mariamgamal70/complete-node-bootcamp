const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const tour = require('./../../models/tourModel');
const user = require('./../../models/userModel');
const review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
// console.log(DB);
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//import data into database
const importData = async (req, res) => {
  try {
    await tour.create(tours);
    await user.create(users, { validateBeforeSave: false }); // we're creating new user without passing password confirm property, we can overcome it by explicitly turn off validation for user
    //also we can comment encryption in usermodel as users we are inputing already have encrypted passwords (ONLY TILL U IMPORT) ONCE U HAVE IMPORTED EVERYTHING UNCOMMENT THE ENCRYPTION
    await review.create(reviews);

    console.log('data successfully loaded');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};
//delete all data from collection (db)

const deleteData = async () => {
  try {
    await tour.deleteMany(); // delete all documents in a certain collection
    await user.deleteMany();
    await review.deleteMany();
    console.log('deleted successfully');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('db connection success');

    if (process.argv[2] === '--import') {
      importData();
    } else if (process.argv[2] === '--delete') {
      deleteData();
    }
  });
