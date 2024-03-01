const express = require('express');
const authController = require('./../controllers/authController.js');
const reviewController = require('./../controllers/reviewController');
const reviewRouter = express.Router({ mergeParams: true }); //u can get tourID from tour router as u merged routes . by default each route has its own params that other routes cant access

//now whenever u get a route like this //post /tour/123df/reviews or like this /reviews it will end up in reviewroutes
reviewRouter.use(authController.protect);

reviewRouter.route('/').get(reviewController.getAllReviews).post(
  authController.restrictTo('user'),
  reviewController.setTourUserIds, //middleware to set user and tour ids
  reviewController.createReview
);
reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );
module.exports = reviewRouter;
