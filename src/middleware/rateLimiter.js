import ratelimit from "../config/upstash.js";

const rateLimieter = async (req, res, next) => {
    try {
        // here we just kept simple.
        // in realworld application, you might want to use user id or ip address
        // to identify the user and limit the requests accordingly.
        const {success} = await ratelimit.limit("my-rate-limit");

        if (!success) {
            return res.status(429).json({
                message : "Please try again later."
            });
        }

        next();
    }catch (error) {
        console.error("Rate limiter error:", error);
        next(error);
    }
}

export default rateLimieter;