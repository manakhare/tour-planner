const AppError = require('./../utils/appError');

//-------Mongodb errors-------

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}.`;
  return new AppError(message, 400); //400 - bad request
}

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]; //checks if errmsg has any of these... and what it contains inside
  // console.log(value) //returns an array of values after encountering any of the aboove regular expression
  
  const message = `Duplicate field values : ${value}. Please use another value!`;
  return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
  //loop over all the error objects

  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;  
  return new AppError(message, 400);
}

//----- development and production errors -------

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error : send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or any other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('ERROR 😶', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};


module.exports = (err, req, res, next) => {
  // if statusCode is not defined, then it is 500 (internal server error)
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  // error is if we have a 500 status code, otherwise it is a fail (400 status code)
  err.status = err.status || 'error'; 

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    // for mongodb errors
    // will return a new error created by AppError class, and hence will be marked operational
    if (error.name ==='CastError') error = handleCastErrorDB(error);
    
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};
