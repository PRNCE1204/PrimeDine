import express from "express";
import { submitReview, getShopReviews } from "../controllers/review.controllers.js";
import isAuth from "../middlewares/isAuth.js";

const reviewRouter = express.Router();

reviewRouter.post("/create", isAuth, submitReview);
reviewRouter.get("/my-shop", isAuth, getShopReviews);

export default reviewRouter;
