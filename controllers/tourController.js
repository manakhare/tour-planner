const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//as soon as someone hits the route of '/top-5-cheap', they will hit this middleware function, and these queries will be filled automatically
//even if the user hadn't filled them themselves.. we pre-fill these query strings for users
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // try {
  //EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate(); //we created an object of the query class
  const tours = await features.query; //If we had used await in line 17 and 22, we woudn't have been able to update the returning query for pagination or sorting.

  //SEND RESPONSe
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id); ///// Tour.findOne({ _id: req.params.id })

  //if no tour exists--null value -- falsey value
  if (!tour) {
    return next(new AppError('No tour found with this ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { tour }, //we can also just do data: { tour }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  //console.log(req.body);

  // console.log(req.body);
  const newTour = await Tour.create(req.body);
  // console.log(newTour);
  res.status(201).json({
    status: 'success',
    data: { newTour },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }); //(find id, data will be available here, returns the updated doc)

  if (!tour) {
    return next(new AppError('No tour found with this ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here....>',
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with this ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  //in aggregation pipeline, we can manipulate data.. it is basically a mongodb method, but mongoose also provides some
  //Here, we pass in an array of stages. The documents pass through them one by one, step by step in the defined sequence.
  //without awaiting, we will get a aggregate object
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, //filters
    },
    {
      $group: {
        //allows to group documents using accumulator
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, //each document adds 1 to numTours
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' }, //finds average of the ratingsAverage query
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      //At this point, our stats object has items according to above stages... so we need to use the same variables if we are referring
      //to something we have already mentioned before
      $sort: { avgPrice: 1 }, //1 sorts in ascending order, -1 sorts is descending order
    },
    // {
    //   $march: { _id: { $ne: 'EASY' } } //removes easy documents from our document (ne -- not equals)
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

//to get number of tours per month
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', //creates multiple documents for each date by deconstructing it--- each startdate has one document
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), //From 2021 Jan 1st
          $lte: new Date(`${year}-12-31`), //To 2021 Dec 31st
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //sorts document according to months
        numTourStarts: { $sum: 1 }, //adds ! to tour in each month (if any)
        tours: { $push: '$name' }, //creates an array and pushes the name of each tour in a particular month in it
      },
    },
    {
      $addFields: {
        month: '$_id', //adds a field month with the same value as the id
      },
    },
    {
      $project: { _id: 0 }, // 0 means that id will no longer show up, and 1 means that it will show
    },
    {
      $sort: { numTourStarts: -1 }, //sorts in descending order, startiing with the highest number
    },
    {
      $limit: 12, //shows only 12 items
    },
  ]);

  // console.log(plan);

  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});
