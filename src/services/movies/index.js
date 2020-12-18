const express = require("express");
const { Transform } = require("json2csv");
const { pipeline } = require("stream");
const { join } = require("path");
const { createReadStream } = require("fs-extra");

const { getReviews, writeReviews, getMovies, writeMovies } = require("../../fsUtilities");
const moviesRouter = express.Router();

moviesRouter.get("/", async (req, res, next) => {
  try {
    const movies = await getMovies()

    if (req.query && req.query.category) {
      const filteredMovies = movies.filter(
        movie =>
          movie.hasOwnProperty("category") &&
          movie.category === req.query.category
      )
      res.send(filteredMovies)
    } else {
      res.send(movies)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
});

moviesRouter.get("/:imdbID", async (req, res, next) => {
    try {
      const movies = await getMovies()
  
      const movieFound = movies.find(movie => movie.imdbID === req.params.imdbID)
  
      if (movieFound) {
        res.send(movieFound)
      } else {
        const err = new Error()
        err.httpStatusCode = 404
        next(err)
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  });
  moviesRouter.get("/:imdbID/reviews", async (req, res, next) => {
    try {
      console.log(req.params.imdbID)
      const movies = await getMovies();
      const filteredMovie = movies.filter(movie => movie.imdbID === req.params.imdbID)
      const reviews = await getReviews();
      const filteredReviews = reviews.filter(r => r.imdbID === req.params.imdbID)
      if (filteredReviews.length > 0) {
        res.send({...filteredMovie,reviews: filteredReviews})
      } else {
        const err = new Error()
        err.httpStatusCode = 404
        next(err)
      }
    } catch (error) {
      next(error)
    }
  });
  moviesRouter.post("/", async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        const error = new Error()
        error.message = errors
        error.httpStatusCode = 400
        next(error)
      } else {
        const movies = await getMovies()
  
        const imdbIDFound = movies.find(movie => movie.imdbID === req.body.imdbID)
  
        if (imdbIDFound) {
          const error = new Error()
          error.httpStatusCode = 400
          error.message = "movie already in db"
          next(error)
        } else {
          movies.push(req.body)
          await writeMovies(movies)
          res.status(201).send({ imdbID: req.body.imdbID })
        }
      }
    } catch (error) {
      console.log(error)
      const err = new Error("An error occurred while reading from the file")
      next(err)
    }
  });
  moviesRouter.put("/:imdbID", async (req, res, next) => {
    try {
      const validatedData = matchedData(req)
      const movies = await getMovies()
  
      const movieIndex = movies.findIndex(movie => movie.imdbID === req.params.imdbID)
  
      if (movieIndex !== -1) {
        const updatedmovies = [
          ...movies.slice(0, movieIndex),
          { ...movies[movieIndex], ...validatedData },
          ...movies.slice(movieIndex + 1),
        ]
        await writeMovies(updatedmovies)
        res.send(updatedmovies)
      } else {
        const err = new Error()
        err.httpStatusCode = 404
        next(err)
      }
    } catch (error) {
      console.log(error)
      const err = new Error("An error occurred while reading from the file")
      next(err)
    }
  });

  moviesRouter.delete("/:imdbID", async (req, res, next) => {
    try {
      const movies = await getMovies()
  
      const movieFound = movies.find(movie => movie.imdbID === req.params.imdbID)
  
      if (movieFound) {
        const filteredmovies = movies.filter(movie => movie.imdbID !== req.params.imdbID)
  
        await writeMovies(filteredmovies)
        res.status(204).send()
      } else {
        const error = new Error()
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  });

  moviesRouter.delete("/:imdbID", async (req, res, next) => {
    try {
      const movies = await getMovies()
  
      const movieFound = movies.find(movie => movie.imdbID === req.params.imdbID)
  
      if (movieFound) {
        const filteredmovies = movies.filter(movie => movie.imdbID !== req.params.imdbID)
  
        await writeMovies(filteredmovies)
        res.status(204).send()
      } else {
        const error = new Error()
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  });
  
  moviesRouter.get("/export/csv", (req, res, next) => {
    try {
      const path = join(__dirname, "movies.json")
      const jsonReadableStream = createReadStream(path)
  
      const json2csv = new Transform({
        fields: ["imdbID", "Title", "Year", "Type", "Poster"],
      })
  
      res.setHeader("Content-Disposition", "attachment; filename=export.csv")
      pipeline(jsonReadableStream, json2csv, res, err => {
        if (err) {
          console.log(err)
          next(err)
        } else {
          console.log("Done")
        }
      })
    } catch (error) {
      next(error)
    }
  })
  
  module.exports = moviesRouter