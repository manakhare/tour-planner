
class AppError extends Error {
    constructor(message, statusCode) {
        //here, we set the message property to the coming msg by doing the parent call
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        //when a new object is created and the constructor function is called, then the function call won't appear in the stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;