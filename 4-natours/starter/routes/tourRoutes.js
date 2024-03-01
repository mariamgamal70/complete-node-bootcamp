const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController'); //not needed as we merged routes
const reviewRouter = require('./../routes/reviewRoutes');

const tourRouter = express.Router(); //middleware that u can use

tourRouter.use('/:tourId/reviews', reviewRouter); //whenever u use that route, u can use reviewrouter just like in app.js (merging routes)

// tourRouter.param('id',tourController.checkID) //runs whenever the word 'id is in the  url (custom made middleware) used when there's code repetition for example
//.post(tourController.checkBody,tourController.createTour); // apply a validation on the create tour route (middleware , controller function)
// any route with middle ware put it first then any other routes with no middle wares under it

tourRouter
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

tourRouter.route('/tour-stats').get(tourController.getTourStats);

tourRouter
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  ); //able to pass in a year parameter

tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin); //find within a certain radius from your location
//latlng is coordinates of where u are, distance is the radius around those coords, unit is the unit of the distance km or m
//it looks like this : /tours-distance/233/center/-40,45/unit/mi ,which is better than the alternative:     /tours-distance?distance=233&center=-40,45&unit=mi

tourRouter
  .route('/distance/:latlng/unit/:unit') //find by searching exact location not within a certain radius
  .get(tourController.getDistances);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

//nested routes ex: POST /tour/jfjf13/reviews/1wefwj

//post /tour/123df/reviews
//get /tour/123df/reviews
//get /tour/123df/reviews/34567gf
// tourRouter //SOLVED USING MERGE PARAMS AS THIS DOESNT BELONG TO TOURS , IT SHOULD BELONG TO REVIEWS)
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
module.exports = tourRouter;
