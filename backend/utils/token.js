import jwt from "jsonwebtoken"

const genToken = async (userId, email, role) => {
    try {
        const token = jwt.sign(
            { userId, email, role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )
        return token
    } catch (error) {
        console.log(error)
    }
}

export default genToken