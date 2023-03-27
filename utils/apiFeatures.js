class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  ////  1a)Filtering  ////
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    ////  1b) Advanced filtering  ////
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`); //b matches the exact words, g allows repetition of values (like for different queries)

    this.query = this.query.find(JSON.parse(queryStr));

    return this; //returns the entire object to the function, so that we can further proceed with making changes on the obj
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); // req.query.sort returns a string, with sorting vars passed in the url after '?sort=price,ratinngsAverage' etc
      this.query = this.query.sort(sortBy); //query.sort(price ratingsAverage) //passed in this manner\\
    } else {
      this.query = this.query.sort('-createdAt'); //-ve --> for decreasing order
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // *1 converts the req.query.page string into a number // else 1 is the default page value
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=3&limit=10 will display : page1(1 -10), page2(11 - 20), page3(21 - 30)  and so on...
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;