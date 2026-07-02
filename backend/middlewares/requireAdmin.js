/**
 * requireAdmin middleware
 * Must be used AFTER isAuth.
 * Returns 403 if the authenticated user is not an admin.
 */
const requireAdmin = (req, res, next) => {
    if (req.userRole !== "admin") {
        return res.status(403).json({
            message: "Access denied. This action requires administrator privileges."
        })
    }
    next()
}

export default requireAdmin
