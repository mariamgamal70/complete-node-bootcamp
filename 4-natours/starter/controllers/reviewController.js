const reviewModel = require('../models/reviewModel');
// const appError = require('../utils/appError');
// const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.getAllReviews= handlerFactory.getAll(reviewModel);
// catchAsync(async(req,res,next)=>{
//   let filter={}
//   if (req.params.tourId) filter = { tour: req.params.tourId };//if  there is a param in the url then we apply that filter to get reviews for that specific tour only , else if filter is empty just get all reviews
// const reviews=await reviewModel.find(filter);
//     res.status(200).json({
//     status: 'success',
//     result: reviews.length,
//     data: {
//         reviews,
//     },
//     });
// });

// for allowing nested routes or getting tour and user ids from the route , we can use middleware and handler factory function instead of creating a whole new code
//middleware to set user and tour ids (used in reviewroutes)
exports.setTourUserIds=(req,res,next)=>{
  //allow nested routes
  if (!req.body.tour) {
    //if id of tour is not specified
    req.body.tour = req.params.tourId; //then its called tourId in the specified route
  }
  if (!req.body.user) {
    req.body.user = req.user.id; //if the body doesnt have the user id , then we can get it from protect middleware (req.user)
  }
  next()
}

exports.createReview= handlerFactory.createOne(reviewModel);
// catchAsync(async(req,res,next)=>{
//   //allow nested routes
//   if(!req.body.tour){//if id of tour is not specified
//     req.body.tour=req.params.tourId;//then its called tourId in the specified route
//   }
//   if(!req.body.user){
//     req.body.user=req.user.id;//if the body doesnt have the user id , then we can get it from protect middleware (req.user)
//   }
//     const newReview = await reviewModel.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: {
//         review: newReview,
//       },
//     });
// })

exports.updateReview = handlerFactory.updateOne(reviewModel);
exports.deleteReview = handlerFactory.deleteOne(reviewModel);
exports.getReview = handlerFactory.getOne(reviewModel);