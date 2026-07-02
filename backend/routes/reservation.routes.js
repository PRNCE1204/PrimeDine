import express from "express";
import { createReservation, getReservations, updateReservationStatus } from "../controllers/reservation.controllers.js";
import isAuth from "../middlewares/isAuth.js";

const reservationRouter = express.Router();

reservationRouter.post("/create", isAuth, createReservation);
reservationRouter.get("/get-all", isAuth, getReservations);
reservationRouter.post("/update-status/:id", isAuth, updateReservationStatus);

export default reservationRouter;
