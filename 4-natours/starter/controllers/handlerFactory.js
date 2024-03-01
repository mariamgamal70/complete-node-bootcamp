const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const appError = require('../utils/appError');
//handler factory functions is a function that returns another function
//it uses a generic function for a certain method to prevent code repetition
//for example instead of creating a delete method in each controller and each of them is almost identical in code, we create one generic delete function that we pass in its model and it handles the delete correctly and same way as it did
exports.deleteOne = model=> catchAsync(async (req, res, next) => {
  const doc = await model.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new appError('no document with that id', 404));
  }
  res.status(204).json({
    //204 means no content bc we dont send any data back u just send null
    status: 'success',
    data: null,
  });
});

exports.updateOne = model => catchAsync(async (req, res, next) => {
  const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new appError('no document with that id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    },
  });
});

exports.createOne = model => catchAsync(async (req, res, next) => {
  // try {
  //const newTour = new Tour({});
  //newTour.save();
  //OR
  const doc = await model.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

exports.getOne = (model,populateOptions)=> catchAsync(async (req, res, next) => {
  // const id = req.params.id ; // convert variable request parameter from string to number
  let query = model.findById(req.params.id);
  if(populateOptions){
    query = query.populate(populateOptions);
  }
  const doc = await query;

  //OR
  // tourModel.findOne({_id:req.params.id})
  // const tour = tours.find((el) => el.id === id); // find the tour of the same id (returns an array of objects that have the same id)
  if(!doc){
    return next(new appError('no document with that id',404));
  }
  res.status(200).json({
    status: 'success',
    result: doc.length,
    data: {
      data: doc,
    },
  });
});

exports.getAll = (model) =>catchAsync(async (req, res, next) => {
  //to allow for nested GET reviews on tour (hack)
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId }; //if  there is a param in the url then we apply that filter to get reviews for that specific tour only , else if filter is empty just get all reviews
  //execute query
  const features = new APIFeatures(model.find(), req.query); //.find returns query, .aggregate returns object
  features.filter().sort().limitFields().paginate();
  const doc = await features.query;
  //query.sort().select().skip().limit()
  //send response
  res.status(200).json({
    status: 'success',
    result: doc.length,
    data: {
      doc,
    },
  });
});