import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token
        if (!token) {
            return res.status(401).json({ message: "Authentication required. Please sign in." })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded) {
            return res.status(401).json({ message: "Invalid or expired session. Please sign in again." })
        }
        req.userId = decoded.userId
        req.userEmail = decoded.email
        req.userRole = decoded.role
        next()
    } catch (error) {
        return res.status(401).json({ message: "Authentication failed. Please sign in again." })
    }
}

export default isAuth