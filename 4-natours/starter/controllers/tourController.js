const appError = require('../utils/appError');
const tourModel = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,Summary,difficulty';
  console.log('hi');
  next();
};

// getalltours should be a function not the result of the function thats why return exists in catchasync
exports.getAllTours = handlerFactory.getAll(tourModel);
// catchAsync(async (req, res, next) => {
//   //execute query
//   const features = new APIFeatures(tourModel.find(), req.query); //.find returns query, .aggregate returns object
//   features.filter().sort().limitFields().paginate();
//   const tours = await features.query;
//   //query.sort().select().skip().limit()
//   //send response
//   res.status(200).json({
//     status: 'success',
//     result: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

exports.getTour = handlerFactory.getOne(tourModel, { path: 'review' });
// catchAsync(async (req, res, next) => {
//   // const id = req.params.id ; // convert variable request parameter from string to number
//   const tour = await tourModel.findById(req.params.id).populate('review');

//   //OR
//   // tourModel.findOne({_id:req.params.id})
//   // const tour = tours.find((el) => el.id === id); // find the tour of the same id (returns an array of objects that have the same id)
//   if(!tour){
//     return next(new appError('no tour with that id',404));
//   }
//   res.status(200).json({
//     status: 'success',
//     result: tour.length,
//     data: {
//       tour: tour,
//     },
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await tourModel.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, //if null then it doesnt group by certain field, //groups by difficulty field
        numTours: { $sum: 1 }, //add 1 for each of the document that passes through this pipline //counter
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1, //1 for ascending
      },
    },
    {
      $match: { _id: { $ne: 'EASY' } }, //matches with all ids except for ones with id=easy
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //*1 transforms string numbers into numbers
  const plan = await tourModel.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          // between the first day of the year and the last day of the year
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //group by the month of start date
        numTourStarts: { $sum: 1 }, //count the num of tours in each month
        tours: { $push: '$name' }, // create an array of tours that are in the month of the start date
      },
    },
    {
      $addFields: { month: '$_id' }, // add a field to the results which has the same value as the id u stated in group
    },
    {
      $project: {
        // 0 or 1 , 0 to hide the field , 1 to show a field
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: 1 }, //1 for ascending and -1 is for descending order
    },
    {
      $limit: 6, //limit result to 6
    },
  ]); //$unwind operator is used to deconstruct an array field in a document and create separate output documents for each item in the array
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.createTour = handlerFactory.createOne(tourModel);
// catchAsync(async (req, res, next) => {
//   // try {
//   //const newTour = new Tour({});
//   //newTour.save();
//   //OR
//   const newTour = await tourModel.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

exports.updateTour = handlerFactory.updateOne(tourModel);
// catchAsync(async (req, res, next) => {
//   const tour = await tourModel.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!tour) {
//     return next(new appError('no tour with that id', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });

// });

exports.deleteTour = handlerFactory.deleteOne(tourModel); //use generic handler function instead of code repetition in each controller

// catchAsync(async (req, res, next) => {
//   const tour = await tourModel.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new appError('no tour with that id', 404));
//   }
//   res.status(204).json({
//     //204 means no content bc we dont send any data back u just send null
//     status: 'success',
//     data: null,
//   });

// });

///tours-within/:distance/center/:latlng/unit/:unit'
// /tours-within/233/center/-40,45/unit/mi ,
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit == 'mi' ? distance / 3963.2 : distance / 6378.1; //convert radius u want to unit radians to put in mongoose
  if (!lat || !lng) {
    next(
      new appError(
        'please provide latitude and longitude in the formate lat,lng',
        400
      )
    );
  }
  const tours = await tourModel.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  }); //$geoWithin is function just like $gte or $lte in mongoose , it finds geospatial location within a certain geometry/radius
  res
    .status(200)
    .json({ status: 'success', results: tours.length, data: { data: tours } });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new appError(
        'please provide latitude and longitude in the formate lat,lng',
        400
      )
    );
  }
  //in order to do calculations we always use aggregate pipline, which is called on the model itself
  //for geospatial aggregation theres only one aggregation stage which is called geonear, geonear always needs to be the first in geospatial pipline
  const distances = await tourModel.aggregate([
    //pass in arry with all the stages of aggregation pipline
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] }, //multiplied by 1 to convert to numbers
        distanceField: 'distance', //name of the field that will be created and store all the calcs
        distanceMultiplier: multiplier, //you can specify the number thats going to be multiplied by distance. in this case we need it to convert to km (same as dividing by 1000) or mi
      },
    },
    {
      $project: { distance: 1, name: 1 }, //gets rid of all the clutter and shows the data that u want . in this case u want to know the distance and tourname only
    },
  ]);
  res.status(200).json({ status: 'success', data: { data: distances } });
});
