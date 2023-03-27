const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], //this msg is displayed if name isn't mentioned
      unique: true,
      trim: true,
      //validators: maxlength, minlength
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        //just for strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty level is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      //min and max work for both numbers and dates
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount should be less than the price',
      },
    },
    summary: {
      type: String,
      trim: true, //removes whitespaces in beginning and end
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      //stores the names of images
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true }, //each time data is outputted as JSON, we want virtuals to be a part of it
    toObject: { virtuals: true },
  }
);

//  A virtual property can be derived
//We can't use them in any query, because they aren't technically the part of our database
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Mongoose MIDDLEWARE
// 1) DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  // console.log(this);  //this keyword gives access to the document that is being processed
  this.slug = slugify(this.name, { lower: true });
  next();
});

//post middleware function have access to the finished document and next middleware fn. They run after all the pre middleware functions are done
// tourSchema.post('save', function(doc, next) {
//   console.log()
// });

// 2) QUERY MIDDLEWARE: runs before and after a certain query is executed
//The this keyword will point to the current query(s) (not document)
//for all find, update
tourSchema.pre(/^find/, function (next) {
  //^ refers to all the strings that start with find
  this.find({ secretTour: { $ne: true } }); //finds a tour that is false
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  console.log(docs);
  next();
});

// 3)AGGREGATION MIDDLEWARE: allows us to add hooks before and after aggregation happens
//this points to the current aggregation object
tourSchema.pre('aggregate', function (next) {
  //In order to not consider secret tours in our stats, we get access to the pipeline array, and add another stage before the $match
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //unshift adds the element in beginning of an array (here, the pipeline array)
  //line 109 removes all the documents that have secretTour: true.... The function then passes through the aggregation function
  console.log(this.pipeline()); //returns the pipeline array
  next();
});

//Creating a model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
