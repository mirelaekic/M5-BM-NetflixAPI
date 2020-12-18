
const express = require("express")
const uniqID = require("uniqid")
const { getReviews, writeReviews } = require("../../fsUtilities")
const { check, valIDationResult } = require("express-validator")

const reviewsRouter = express.Router()

reviewsRouter.get("/:ID", async (req, res, next) => {
  try {
    const reviewsDB = await getReviews()
    const review = reviewsDB.filter(review => review.ID === req.params.ID)
    if (review.length > 0) {
      res.send(review)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    next(error)
  }
})

reviewsRouter.get("/", async (req, res, next) => {
  try {
    const reviewsDB = await getReviews()
    if (req.query && req.query.name) {
      const filteredreviews = reviewsDB.filter(
        review =>
          review.hasOwnProperty("name") &&
          review.name.toLowerCase() === req.query.name.toLowerCase()
      )
      res.send(filteredreviews)
    } else {
      res.send(reviewsDB)
    }
  } catch (error) {
    next(error)
  }
})

reviewsRouter.post(
  "/",
  [
    check("name")
      .isLength({ min: 3 })
      .withMessage("name too short!")
      .exists()
      .withMessage("Insert a name please!"),
  ],
  [
    check("comment")
      .isLength({ min: 4 })
      .withMessage("Comment too short!")
      .exists()
      .withMessage("Insert a comment please!"),
  ],
  [
    check("rate")
      .exists()
      .withMessage("Please rate a movie!"),
  ],
  [
    check("imdbID")
      .exists()
      .withMessage("Please add the movie ID"),
  ],
  async (req, res, next) => {
    try {
      const errors = valIDationResult(req)

      if (!errors.isEmpty()) {
        const err = new Error()
        err.message = errors
        err.httpStatusCode = 400
        next(err)
      } else {
        const reviewsDB = await getReviews()
        const newreview = {
          ...req.body,
          ID: uniqID(),
          createdAt: new Date(),
        }

        reviewsDB.push(newreview)

        await writeReviews(reviewsDB)

        res.status(201).send({ ID: newreview.ID })
      }
    } catch (error) {
        console.log(error)
      next(error)
    }
  }
)

reviewsRouter.delete("/:ID", async (req, res, next) => {
  try {
    const reviewsDB = await getReviews()
    const newDb = reviewsDB.filter(review => review.ID !== req.params.ID)
    await writeReviews(newDb)

    res.status(204).send()
  } catch (error) {
      console.log(error)
    next(error)
  }
})

reviewsRouter.put("/:ID", async (req, res, next) => {
  try {
    const reviewsDB = await getReviews()
    const newDb = reviewsDB.filter(review => review.ID !== req.params.ID)

    const modifiedreview = {
      ...req.body,
      ID: req.params.ID,
      updatedAt: new Date(),
    }

    newDb.push(modifiedreview)
    await writeReviews(newDb)

    res.send({ ID: modifiedreview.ID })
  } catch (error) {
    next(error)
  }
})

module.exports = reviewsRouter