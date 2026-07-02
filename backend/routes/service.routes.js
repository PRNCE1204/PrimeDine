import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { createServiceRequest, getActiveServiceRequests, completeServiceRequest } from "../controllers/service.controllers.js";

const serviceRouter = express.Router();

serviceRouter.post("/request", isAuth, createServiceRequest);
serviceRouter.get("/active", isAuth, getActiveServiceRequests);
serviceRouter.post("/complete/:id", isAuth, completeServiceRequest);

export default serviceRouter;
