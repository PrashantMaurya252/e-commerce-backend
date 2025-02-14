import Stripe from "stripe";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Payment } from "../models/paymentModel.js";

const addProduct = asyncHandler(async (req, res) => {
  const { productName, productCategory, productPrice, productDescription } =
    req.body;

  if (
    [productName, productCategory, productPrice, productDescription].some(
      (field) => field.trim() === ""
    )
  ) {
    throw new ApiError(500, "All Fields are required");
  }

  const productImageLocalPath = req.file?.path;

  if (!productImageLocalPath) {
    throw new ApiError(500, "product Image not found");
  }

  const productImage = await uploadOnCloudinary(productImageLocalPath);
  if (!productImage) {
    throw new ApiError(
      400,
      "There is an error while product image uploading on cloudinary"
    );
  }
  const product = await Product.create({
    name: productName,
    category: productCategory,
    image: productImage.url,
    description: productDescription,
    price: productPrice,
  });

  const createdProduct = await Product.findById(product._id);

  if (!createdProduct) {
    throw new ApiError(500, "something went wrong while adding product");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdProduct, "product added"));
});

const markFavourite = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const productId = req.params.productId;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(500, "Product does not exist");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "User does not exist");
  }
  const isFavourite = await user.favourites.some(
    (fav) => fav.item.toString() === productId
  );
  if (isFavourite) {
    throw new ApiError(400, "This Product already mark favourite");
  }

  user.favourites.push({
    item: productId,
    addedAt: Date.now(),
  });

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, user.favourites, "Product mark as favourite"));
});

const markUnFavourite = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product does not exist");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isFavourite = await user.favourites.some(
    (fav) => fav.item.toString() === productId
  );

  if (!isFavourite) {
    throw new ApiError(400, "This product is not marked favourite");
  }

  user.favourites = user.favourites.filter(
    (filter) => filter.item.toString() !== productId
  );

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, user.favourites, "product unmarked successfully")
    );
});

const getFavouriteProducts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).populate({
    path: "favourites.item",
    model: "Product",
    select: "name category image description price",
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const favouriteProducts = await user.favourites.map((fav) => fav.item);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        favouriteProducts,
        "Favourite products request successful"
      )
    );
});

const getAllProduct = asyncHandler(async (req, res) => {
  // Adding Pagination

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const price = req.query.price ? parseInt(req.query.price) : undefined;
  const name = req.query.name ? req.query.name : undefined;

  const user = req?.user;
  let favouriteProductId = [];

  if (user) {
    const userWithFavouritesProducts = await User.findById(user._id).select(
      "favourites"
    );
    favouriteProductId = userWithFavouritesProducts
      ? userWithFavouritesProducts?.favourites
      : [];
  }

  console.log(favouriteProductId,"favouriteProductId")

  const filter = {};

  if (price) {
    filter.price = price;
  }

  if (name) {
    filter.name = new RegExp(name, "i");
  }

  const aggregateQuery = Product.aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
  ]);

  const options = {
    page,
    limit,
    customLabels: {
      totalDocs: "totalItems",
      docs: "products",
    },
  };

  const products = await Product.aggregatePaginate(aggregateQuery, options);

  const updateProduct = products?.products.map((item) => {
    if (user) {
      return {
        ...item,
        isfavourite: favouriteProductId.includes(item?._id.toString()),
      };
    } else {
      return {
        ...item,
      };
    }
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...products, products: updateProduct },
        "All Products are here"
      )
    );
});

const addedToCart = asyncHandler(async (req, res) => {
  const userId = req?.user._id;

  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "this product is not available");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const productInCart = await user.cart.find(
    (cartItem) => cartItem.item.toString() === productId
  );

  if (productInCart) {
    productInCart.quantity += quantity || 1;
  } else {
    user.cart.push({
      item: productId,
      quantity: quantity || 1,
    });
  }

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, user.cart, "item added to cart"));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req?.user._id;

  const { productId, quantity, removeAll } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "this product is not available");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const productInCart = await user.cart.find(
    (cartItem) => cartItem.item.toString() === productId
  );

  if (!productInCart) {
    throw new ApiError(404, "Product not found");
  }

  if (removeAll || productInCart.quantity <= quantity || quantity === 0) {
    user.cart = user.cart.filter(
      (filter) => filter.item.toString() !== productId
    );
  } else {
    productInCart.quantity -= quantity || 1;

    if (productInCart.quantity <= 0) {
      user.cart = user.cart.filter(
        (filter) => filter.item.toString() !== productId
      );
    }
  }

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, user.cart, "item removed to cart"));
});

// const cartItems = asyncHandler(async(req,res)=>{
//   const {userId} = req.user
// })

const searchName = asyncHandler(async (req, res) => {
  const { searchTerm } = req.query;

  try {
    const searchQuery = {
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ],
    };

    const product = await Product.find(searchQuery);

    res
      .status(200)
      .json(new ApiResponse(200, product, "Search api called successfully"));
  } catch (error) {
    throw new ApiError(404, "error in calling search api");
  }
});

const stripePayment = asyncHandler(async (req, res) => {
  const { products, amount, userId } = req.body;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "inr",
      metaData: { userId, products: JSON.stringify(products) },
    });

    const payment = new Payment({
      userId,
      products,
      amount,
      paymentIntentId: paymentIntent.id,
      status: "pending",
    });
    await payment.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(200, { clientSecret: paymentIntent.client_secret });
  } catch (error) {
    throw new ApiError(500, "Something went wrong with payment request");
  }
});

const paymentStatus = asyncHandler(async (req, res) => {
  const { paymentIntentId, status } = req.body;

  try {
    const payment = await Payment.findOne({ paymentIntentId });

    if (payment) {
      payment.status = status;
      await payment.save({ validateBeforeSave: false });
      res
        .status(200)
        .json(new ApiResponse(200, {}, "payment status updated successfully"));
    } else {
      throw new ApiError(
        404,
        "some error happend during payment status update"
      );
    }
  } catch (error) {
    throw new ApiError(400, "Some error happend in payment-status api");
  }
});

export {
  addProduct,
  markFavourite,
  markUnFavourite,
  getFavouriteProducts,
  getAllProduct,
  addedToCart,
  removeFromCart,
  searchName,
  stripePayment,
  paymentStatus,
};
