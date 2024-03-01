const mongoose = require('mongoose');
// const userModel=require('./userModel');
const tourModel = require('./tourModel');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      // parent referencing
      type: mongoose.Schema.ObjectId,
      ref: 'tours',
      required: [true, 'review must belong to a tour'],
    },
    user: {
      //parent referencing
      type: mongoose.Schema.ObjectId,
      ref: 'users',
      required: [true, 'review must belong to a user'],
    },
  },
  {
    //second option is schema options (used to show virtual properties)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }, //display virtual as object
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // each combination of tour and user has always to be unique

reviewSchema.pre(/^find/, function (next) {
  //anything that starts with find ex: findanddelete/findandupdate
  this
    // .populate({
    //   //this points to the current query
    //   path: 'tour',
    //   select: 'name', //- means remove the selected fields from showing in the population
    //}) //commented because it creates inefficient chain of populates
    .populate({
      //this points to the current query
      path: 'user',
      select: 'name photo', //we dont need user private data when viewing reviews
    }); //populate is used to replace the referenced id , the parameter of the populate function is an object that has path (the name of the field u want to populate) and select is optional (fill out the fields only in the query but not in the database);
  //using populate twice means u want to fill out 2 fields
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourID) {
  //static method
  const stats = await this.aggregate([
    //this points to  model not document
    {
      $match: { tour: tourID },
    },
    {
      $group: {
        // get all reviews  for one particular tour and group them together
        _id: '$tour',
        nRating: { $sum: 1 }, //increment each  time we see a review for a given tour
        avgRating: { $avg: '$rating' }, //average rating per tour
      },
    },
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await tourModel.findByIdAndUpdate(tourID, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await tourModel.findByIdAndUpdate(tourID, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  //post middleware does not get access to "next"
  //we used post not pre as the current review is not yet in the collection just yet, therefore match shouldnt be able to appear in the output,therefore use post as current review wouldve been created by then
  //this points to current review (document) , this.constructor points to the current model (that created that document)
  // reviewModel.calcAverageRatings(this.tour); //cannot be used as reviewmodel is initiated after this middleware calling
  this.constructor.calcAverageRatings(this.tour); //use this way to overcome that problem
});

//to run calcAverageRatings function on findByIdAndUpdate and findByIdAndDelete , we need to use query middlewares

reviewSchema.pre(/^findOneAnd/, async function (next) {
  //access the document not the query
  this.review = await this.findOne(); // we need to use findone as we initially dont have access to the current document, we need to retrieve it
  //we saved the document in this.review to be able to access it in another query middleware (post) where we actually use calcAverageRatings function
  // console.log(this.review);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  //await this.findOne(); does not work here, quey has already excuted
  await this.review.constructor.calcAverageRatings(this.review.tour);
  //this.review.constructor accesses the current model
});
const reviewModel = mongoose.model('reviews', reviewSchema);

module.exports = reviewModel;
