const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());

app.use(express.static(`{__dirname}/public`));

// 2) ROUTE HANDLERS

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//to catch all the routes that aren't the above mentioned... we'll get this json response instead of a HTML document
//* means all
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // whenever we pass something in next, it assumes that it is an error, skips all the middlewares in the middleware stack
  // and send the error to the global error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//express comes with error handling middlewares. Whenever we use 4 parameters, express automatically knows that we are initialising 
//an error handling middleware 
app.use(globalErrorHandler);



// 4) START SERVER

module.exports = app;
