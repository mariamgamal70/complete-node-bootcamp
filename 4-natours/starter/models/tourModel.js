const mongoose = require('mongoose');
const userModel = require('./userModel');
//SCHEMA CREATION
const tourSchema = new mongoose.Schema(
  {
    //first object is schema definition
    name: {
      type: String,
      required: [true, 'a tour must have a name'],
      unique: true,
      trim: true,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'ratings must be above 1'],
      max: [5, 'ratings must be less than 5'],
      set: (val) => Math.round(val * 10) / 10, // 4.6666 -> 46.6666 -> 47 -> 4.7  because round is going to round it to an integer not decimal //setter function is going to run each time that theres a new value for the ratings average field
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, 'a tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'a tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'a tour must have a difficulty'],
    },
    price: {
      type: Number,
      required: [true, 'a tour must have a price'],
    },
    priceDiscount: Number,
    Summary: {
      type: String,
      trim: true, // removes all the white space at the beginning and at the end of the string
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      // name of image as a reference
      type: String,
      required: [true, 'a tour must have a cover image'],
    },
    images: [String], //an array of strings
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //doesnt appear when written in query (hidden from user)
    },
    startDates: [Date], //array of dates
    startLocation: {
      //used to specify location ,should have 2 fields: type, coordinates. other than that theyre optional
      //GeoJSON (type , coordinates) and each one is nested
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'], // it can be line / polygon but in this case its point only
      },
      coordinates: [Number], //means u expect an array of numbers[longitude,latitude]
      address: String,
      description: String,
    },
    locations: [
      // use array of object to embed locations into tours
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number, //day that theyre going on the tour
      },
    ],
    // guides: Array,//embed users into tours through this and a middleware
    guides: [
      //another way which is child references(u dont need to import user model in here)
      //the tour would contain the id of the tour guides not the tour guide object itself (tour guide is not embedded into the tour)
      {
        type: mongoose.Schema.ObjectId, //u specify what u expect exactly
        ref: 'users', //child reference (name of the collection u r referencing to in db)
      },
    ],
  },
  {
    //second option is schema options (used to show virtual properties)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }, //display virtual as object
  }
);
//indexing : it arranges certain field ascending/descending which helps with preformance,this helps when querying in route, it searches in less documents ,but do not use it with fields that have high write, because indexing also takes storage, and just think about which fields users would like to filter the most and index them, dont just index anything
tourSchema.index({ price: 1, ratingsAverage: -1 }); //price -1 for descending order
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//VIRTUALS

//virtual properties are fields that can be defined on our schema but it will not be persistant (they will not be saved on database to save space)
//u cannot use virtual properties in queries
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; //this points to the current document
}); //get method is used as it will be created each time we get data from database //get takes a callback function

//virtual populate (its the same as child referencing (embedding) but its not saved on db)(aka each tour will be able to view all its reviews)
tourSchema.virtual('review', {
  ref: 'reviews', //schema u want to reference/ connect to
  foreignField: 'tour', //we have field called tour in review model which has the id of the tour it belongs to, so we specify that in the foreignfield to connect both models
  localField: '_id', //then u need to specify where that tour id is specified in the current model (tourmodel)
});

//MONGOOSE MIDDLEWARES
// //mongoose middlewares have pre and post hooks (functions that run between saving and actually being saved  or after being saved)
// //document middleware that runs before saving (.save(), .create()) a document
// //u can act on this document before it is saved

// tourSchema.pre('save',async function(next){//used to get the data of the embeded user guide array
// // console.log(this);
// const guidesPromises=this.guides.map(async id=>await userModel.findById(id));// array of promises
// this.guides= await Promise.all(guidesPromises); //await the result of the promises all at once then overwrite guides
// next();
// });

////query middle ware
tourSchema.pre(/^find/, function (next) {
  //anything that starts with find ex: findanddelete/findandupdate
  this.populate({
    //this points to the current query (used to populate all ur docs)
    path: 'guides',
    select: '-__v -passwordChangedAt', //- means remove the selected fields from showing in the population
  }); //populate is used to replace the referenced tour guide id , the parameter of the populate function is an object that has path (the name of the field u want to populate) and select is optional (fill out the fields called guides in tourmodel only in the query but not in the database);
  //using populate a lot might affect performance as it creates new query
  //we used populate in here instead of tourcontroller to prevent code repetition (to populate all of ur documents)
  next();
});
// //post middleware functions are executed after all pre middlewares are executed
// tourSchema.post('save', function (doc,next) {
//   console.log(doc); //print after document is saved
//   next();
// });
// //you can have multiple pre or post middlewares to the same hook

//MODEL CREATION
const tourModel = mongoose.model('tours', tourSchema); //use model to create a tour document and in order to use a model u need to create a schema (Structure for data)

module.exports = tourModel;
