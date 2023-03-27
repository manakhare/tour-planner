// 1) to catch async errors, intead of using try-catch block
// 2) fn is an asynchronous function that returns a promise, and when there's an error in an async function, that means the promise got rejected
// 3) We catch that error here

// 1) To get rid of the try-catch block, we wrapped our async function inside catchAsync function
// 2) Catch async will return a new anonymous function, which will be assigned to createTour(say)...
//    this means that this anonymous fn (line 21) is called when a new tour is created using the createTour handler (that's why it has the same signature)
// 3) This anonymous function will call the fn that was initially passed in it, and will execute it
// 4) Since, fn is an async function, it wil return a promise. If it has any error, then we can catch it using the catch method that is available on all promises
// 5) The catch method passes the error in the next function, which leads to the error ending up in the globalErrorHandler middleware

module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
