/**
 * requireCook middleware
 * Must be used AFTER isAuth.
 * Returns 403 if the authenticated user is not a cook.
 */
const requireCook = (req, res, next) => {
    if (req.userRole !== "cook") {
        return res.status(403).json({
            message: "Access denied. This action requires cook-level access."
        })
    }
    next()
}

export default requireCook
