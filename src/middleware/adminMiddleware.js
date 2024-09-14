import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

 const verifyAdmin = asyncHandler(async (req, res, next) => {
  const isadmin = req.user?.isAdmin;

  console.log(req.user, "requested user")

  if (!isadmin) {
    throw new ApiError(401, "Unauthorized request or user is not admin");
  }
  next();
});

export default verifyAdmin
