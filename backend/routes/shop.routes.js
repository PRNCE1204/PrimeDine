import express from "express"
import { createEditShop, getMyShop, getShopByCity, assignCook, getCookShop } from "../controllers/shop.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import requireAdmin from "../middlewares/requireAdmin.js"
import { upload } from "../middlewares/multer.js"

const shopRouter = express.Router()

shopRouter.post("/create-edit", isAuth, requireAdmin, upload.single("image"), createEditShop)
shopRouter.get("/get-my", isAuth, getMyShop)
shopRouter.get("/get-by-city/:city", isAuth, getShopByCity)
shopRouter.post("/assign-cook", isAuth, requireAdmin, assignCook)
shopRouter.get("/get-cook-shop", isAuth, getCookShop)

export default shopRouter