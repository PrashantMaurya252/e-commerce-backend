import { Router } from "express";
import { addProduct, getAllProduct, getFavouriteProducts, markFavourite, markUnFavourite } from "../controllers/productController.js";
import verifyAdmin from "../middleware/adminMiddleware.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";

const router = Router()
router.route('/add-product').post(verifyJWT,verifyAdmin,upload.single("productImage"),addProduct)
router.route('/mark-favourite/:productId').post(verifyJWT,markFavourite)
router.route('/unmark-favourite/:productId').post(verifyJWT,markUnFavourite)
router.route('/favourite-products').get(verifyJWT,getFavouriteProducts)
router.route('/all-products').get(verifyJWT,getAllProduct)


export default router