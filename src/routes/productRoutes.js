import { Router } from "express";
import { addProduct, markFavourite } from "../controllers/productController.js";
import verifyAdmin from "../middleware/adminMiddleware.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";

const router = Router()
router.route('/add-product').post(verifyJWT,verifyAdmin,upload.single("productImage"),addProduct)
router.route('/mark-favourite/:productId').post(verifyJWT,markFavourite)


export default router