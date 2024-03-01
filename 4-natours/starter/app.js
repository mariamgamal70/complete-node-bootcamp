const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); // used against bruteforce attacks
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes.js');
const userRouter = require('./routes/userRoutes.js');
const reviewRouter = require('./routes/reviewRoutes.js');
const appError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');

const app = express();

app.set('view engine', 'pug'); // set up pug which is a template engine
app.set('views', path.join(__dirname, 'views')); //path of views file , path from where we launched the node application, use directory name variable

//middleware: function that can modify the incoming request data (stands in the middle of req and res)
//1)global middlewares

//serving static files
//app.use(express.static(`${__dirname}/public`)); //was like this
app.use(express.static(path.join(__dirname, 'public'))); // now its like this //all static assests will be automatically used from public folder

//set security http headers (best to write at the beginning of the code)
app.use(helmet());
//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//limit request from same api
const limiter = rateLimit({
  //how many request per ip can we send in one time
  max: 100, //100 requests per hour
  windowMs: 60 * 60 * 1000,
  message: 'too many request from this ip, please try again in an hour',
}); //func recieves object of objects
app.use('/api', limiter); // it'll affect all the routes that starts with 'api'
//body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //limit the amount of incoming data
//data sanitization against nosql query injection(best after the middleware that recieves data)
app.use(mongoSanitize());
//data sanitization against xss (cross sized scripting attacks) (html scripts)
app.use(xss());
//prevent parameter pollution (query sorting example)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.get('/', (req, res) => {
  res.status(200).render('base', { tour: 'The forest hiker', user: 'Jonas' }); // similar to the way u render root in react. it first searches for the views folder where u set up pug , then inside it, it searches for base.pug (The file that u are going to render). it then renders it and sends it as a response to the browser
});
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//middleware to handle all other unknown routes, .all means all http methods , * means all routes
//since this middleware is after the prev app.use then it'll handle any routes other than the prev
app.all('*', (req, res, next) => {
  next(new appError(`cant find ${req.originalUrl} on this server!`, 400)); //<< if u pass error its going to know that its going to stop the whole program and go to the error middleware
});

//error handling middleware
app.use(globalErrorHandler);

module.exports = app;

//APP HAS ROUTES AND MIDDLEWARES
