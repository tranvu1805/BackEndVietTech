"use strict";

const {
  ConflictRequestError,
  NotFoundError,
} = require("../core/error.response");
const { cart } = require("../models/cart.model");
const { billRepo } = require("../models/bill.model");
const Products = require("../models/product.model");
const Account = require("../models/account.model");
const { discountRepo } = require("../models/disscount.model");
const productModel = require("../models/product.model");
const vnpayConfig = require("../configs/vnpay");
const moment = require("moment");
const qs = require("qs");
const crypto = require("crypto");
const detailsVariantModel = require("../models/detailsVariant.model");
const { log } = require("console");


class CartService {
  //Start Repo

  //Tạo mới giỏ hàng hoặc cập nhật giỏ hàng
  static async createUserCart({ userId, product }) {
    try {
      const query = {
        cart_userId: userId,
        cart_state: "active",
      };

      console.log("check pro", product);


      // Tạo cart_product với thông tin đầy đủ
      const productToAdd = {
        productId: product.productId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: product.quantity || 1,
        detailsVariantId: product.detailsVariantId,
      };

      // Chỉ thêm biến thể nếu có
      if (product.variant) {
        productToAdd.variant = product.variant;
      }

      // Tìm giỏ hàng hiện tại
      const existingCart = await cart.findOne(query);

      if (!existingCart) {
        // Nếu chưa có giỏ hàng, tạo mới
        return await cart.create({
          cart_userId: userId,
          cart_state: "active",
          cart_products: [productToAdd],
        });
      }

      // Nếu đã có giỏ hàng, thêm sản phẩm vào
      existingCart.cart_products.push(productToAdd);
      return await existingCart.save(); // Trigger middleware pre-save
    } catch (error) {
      console.error("Error creating user cart:", error);
      throw error;
    }
  }
  //Check sản phẩm có trong giỏ hàng hay chưa
  // Trong phương thức isProductInCart
  static async isProductInCart({ userId, productId, detailsVariantId }) {
    try {
      console.log("Checking if product in cart:", {
        userId,
        productId,
        detailsVariantId,
      });

      // Chuyển đổi kiểu dữ liệu để đảm bảo nhất quán
      const userIdObj = userId.toString();
      // const productIdObj = productId.toString();
      // const variantIdObj = variantId ? variantId.toString() : null;

      // Tìm giỏ hàng
      const userCart = await cart.findOne({
        cart_userId: userIdObj,
        cart_state: "active",
      });

      if (
        !userCart ||
        !userCart.cart_products ||
        userCart.cart_products.length === 0
      ) {
        console.log("Cart not found or empty");
        return false;
      }

      // Kiểm tra thủ công từng sản phẩm trong giỏ hàng
      console.log(
        "Checking cart products:",
        JSON.stringify(userCart.cart_products, null, 2)
      );

      const foundProduct = userCart.cart_products.some((item) =>
        item.productId.toString() === productId.toString() &&
        item.detailsVariantId?.toString() === detailsVariantId?.toString()
      );


      console.log("Is product in cart:", foundProduct);
      return foundProduct;
    } catch (error) {
      console.error("Error checking product in cart:", error);
      throw error;
    }
  }


  static async getProductFromCart({ userId, productId, variantId }) {
    try {
      console.log("Getting product from cart:", {
        userId,
        productId,
        variantId,
      });

      const userCart = await cart.findOne({
        cart_userId: userId,
        cart_state: "active",
      });

      if (
        !userCart ||
        !userCart.cart_products ||
        userCart.cart_products.length === 0
      ) {
        console.log("Cart not found or empty");
        return null;
      }

      console.log(
        "Cart items:",
        JSON.stringify(userCart.cart_products, null, 2)
      );

      // Tìm sản phẩm trong giỏ hàng
      let matchingProduct;

      if (variantId) {
        // Tìm sản phẩm với biến thể cụ thể
        console.log(
          `Looking for product ${productId} with variant ${variantId}`
        );
        matchingProduct = userCart.cart_products.find((p) => {
          const productMatch = p.productId.toString() === productId.toString();
          let variantMatch = false;

          // Kiểm tra variant trong cả hai vị trí có thể có
          if (p.variant && p.variant.variantId) {
            variantMatch =
              p.variant.variantId.toString() === variantId.toString();
          } else if (p.variantId) {
            variantMatch = p.variantId.toString() === variantId.toString();
          }

          return productMatch && variantMatch;
        });
      } else {
        // Tìm sản phẩm không có biến thể
        console.log(`Looking for product ${productId} without variant`);
        matchingProduct = userCart.cart_products.find((p) => {
          const productMatch = p.productId.toString() === productId.toString();
          const noVariant =
            (!p.variant || !p.variant.variantId) && !p.variantId;
          return productMatch && noVariant;
        });
      }

      console.log("Matching product:", matchingProduct ? "found" : "not found");
      return matchingProduct || null;
    } catch (error) {
      console.error("Error getting product from cart:", error);
      throw error;
    }
  }
  //Cập nhật số lượng sản phẩm trong giỏ hàng
  static async updateUserCartQuantity({ userId, product }) {
    try {
      console.log("Updating cart quantity:", product);
      const { productId, quantity, detailsVariantId } = product;

      // Chuyển đổi ID để so sánh
      const productIdStr = productId.toString();
      const detailsVariantIdStr = detailsVariantId?.toString();

      // Tìm giỏ hàng
      const userCart = await cart.findOne({
        cart_userId: userId,
        cart_state: "active",
      });

      if (!userCart) {
        throw new NotFoundError("Cart not found");
      }

      console.log(
        "Current cart items:",
        JSON.stringify(userCart.cart_products, null, 2)
      );

      // Tìm sản phẩm trong giỏ hàng

      const productIndex = userCart.cart_products.findIndex(
        (item) =>
          item.productId.toString() === productIdStr &&
          item.detailsVariantId?.toString() === detailsVariantIdStr
      );

      console.log("Found product at index:", productIndex);

      if (productIndex === -1) {
        throw new NotFoundError("Product with specific variant not found in cart");
      }


      // Tính toán số lượng mới
      const newQuantity =
        userCart.cart_products[productIndex].quantity + quantity;
      console.log("New quantity:", newQuantity);

      // Nếu số lượng mới <= 0, xóa sản phẩm
      if (newQuantity <= 0) {
        console.log("Removing product from cart");
        // Xóa sản phẩm khỏi mảng
        userCart.cart_products.splice(productIndex, 1);
      } else {
        // Cập nhật số lượng
        userCart.cart_products[productIndex].quantity = newQuantity;
      }

      // Lưu giỏ hàng
      const updatedCart = await userCart.save();
      console.log("Cart updated successfully");
      return updatedCart;
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      throw error;
    }
  }

  //End Repo

  // thanh toán
  static async checkout({
    userId,
    address,
    phone_number,
    receiver_name,
    payment_method,
    discount_code,
  }) {
    const currentCart = await cart.findOne({
      cart_userId: userId,
      cart_state: "active",
    });
    if (!currentCart) {
      return {
        code: 400,
        message: "Cart not found",
        status: "error",
      };
    }

    if (!currentCart.cart_products || currentCart.cart_products.length === 0) {
      return {
        code: 400,
        message: "Cart is empty. Cannot proceed to checkout.",
        status: "error",
      };
    }

    // Chỉ lấy sản phẩm có isSelected == true
    const selectedProducts = currentCart.cart_products.filter((p) => p.isSelected);

    if (!selectedProducts || selectedProducts.length === 0) {
      return {
        code: 400,
        message: "No selected products to checkout.",
        status: "error",
      };
    }

    let total = 0;
    const bulkUpdateOps = [];

    // currentCart.cart_products.forEach((e) => (total += e.price * e.quantity));
    for (const item of selectedProducts) {
      console.log("🔹 productModel:", productModel);
      const product = await productModel.findById(item.productId);

      if (!product) {
        return {
          code: 404,
          message: `Product with ID ${item.productId} not found`,
          status: "error",
        };
      }

      if (product.product_stock < item.quantity) {
        return {
          code: 400,
          message: `Not enough stock for product ${product.product_name}`,
          status: "error",
        };
      }

      if (item.detailsVariantId) {
        const variant = await DetailsVariant.findById(item.detailsVariantId);
        if (!variant) {
          return {
            code: 404,
            message: `Variant not found for product ${item.productId}`,
            status: "error",
          };
        }

        if (variant.stock < item.quantity) {
          return {
            code: 400,
            message: `Not enough stock for variant of product ${product.product_name}`,
            status: "error",
          };
        }

        // Giảm tồn kho của variant
        await DetailsVariant.updateOne(
          { _id: item.detailsVariantId },
          { $inc: { stock: -item.quantity } }
        );
      }

      console.log(
        `🔹 Trước khi cập nhật: ${product.product_name} (Stock: ${product.product_stock})`
      );

      // Giảm số lượng tồn kho
      bulkUpdateOps.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { product_stock: -item.quantity } },
        },
      });

      total += item.price * item.quantity;
    }

    // Cập nhật tồn kho của tất cả sản phẩm cùng lúc
    if (bulkUpdateOps.length > 0) {
      await productModel.bulkWrite(bulkUpdateOps);
    }

    // Kiểm tra lại stock sau khi cập nhật
    for (const item of selectedProducts) {
      const updatedProduct = await productModel.findById(item.productId);
      console.log(
        `✅ Sau khi cập nhật: ${updatedProduct.product_name} (Stock: ${updatedProduct.product_stock})`
      );
    }

    const shippingFee = 35;
    total += shippingFee;

    // Kiểm tra mã giảm giá
    let discountAmount = 0;
    let discount = null;

    if (discount_code) {
      discount = await discountRepo.findOne({
        code: discount_code,
        is_active: true,
        expiration_date: { $gte: new Date() }, // Kiểm tra chưa hết hạn
      });

      if (discount) {
        discountAmount = discount.discount_amount;
      }
    }

    total -= discountAmount; // Trừ vào tổng tiền

    // Sinh mã đơn hàng ngẫu nhiên 5 chữ số
    const orderCode = Math.floor(10000 + Math.random() * 90000);

    if (payment_method === "vnpay") {
      // Tạo request VNPay
      const date = new Date();
      const createDate = moment(date).format("YYYYMMDDHHmmss");
      const orderInfo = `Thanh toán đơn hàng #${orderCode}`;

      let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnpayConfig.vnp_TmnCode,
        vnp_Amount: Math.round(total * 100), // VNPay
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderCode.toString(),
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "billpayment",
        vnp_Locale: "vn",
        vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: createDate,
      };

      // Sắp xếp tham số theo thứ tự alphabet
      vnp_Params = Object.fromEntries(Object.entries(vnp_Params).sort());

      // Tạo chuỗi query và mã hóa với SHA512
      const signData = qs.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnp_Params.vnp_SecureHash = signed;

      const paymentUrl = `${vnpayConfig.vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;

      return { code: 200, status: "redirect", paymentUrl };
    }

    const newBill = await billRepo.create({
      user_id: currentCart.cart_userId,
      products: selectedProducts,
      order_code: orderCode,
      address: address,
      total: total,
      shipping_fee: shippingFee,
      phone_number: phone_number,
      receiver_name: receiver_name,
      status: "pending",
      payment_method: payment_method || "tm",
      discount_code: discount_code || null,
      discount_amount: discountAmount || 0, // Số tiền đã giảm
    });

    // await currentCart.deleteOne()
    return newBill;
  }

  static async updateIsSelected({ userId, productId, detailsVariantId, isSelected }) {
    try {
      // Tìm giỏ hàng của người dùng
      const currentCart = await cart.findOne({ cart_userId: userId, cart_state: "active" });

      if (!currentCart) {
        return {
          code: 400,
          message: "Cart not found",
          status: "error",
        };
      }

      // Tìm sản phẩm trong giỏ hàng
      const productIndex = currentCart.cart_products.findIndex(
        (p) =>
          p.productId.toString() === productId.toString() &&
          p.detailsVariantId?.toString() === detailsVariantId?.toString()
      );

      if (productIndex === -1) {
        return {
          code: 404,
          message: "Product not found in cart",
          status: "error",
        };
      }

      // Cập nhật trạng thái isSelected
      currentCart.cart_products[productIndex].isSelected = isSelected;

      // Lưu lại giỏ hàng sau khi cập nhật
      await currentCart.save();

      return {
        code: 200,
        message: "Product selection updated successfully",
        status: "success",
      };
    } catch (error) {
      console.error("Error updating isSelected:", error);
      return {
        code: 500,
        message: "Internal server error",
        status: "error",
      };
    }
  }

  static async addToCart({ userId, product = {} }) {
    try {
      const productInput = product.product;
      console.log("Adding product to cart:", productInput);

      // Kiểm tra người dùng tồn tại
      const userExists = await Account.exists({ _id: userId });
      if (!userExists) {
        throw new NotFoundError("User not found");
      }

      // Tìm sản phẩm chính
      const existingProduct = await Products.findById(productInput.productId);
      if (!existingProduct) {
        throw new NotFoundError("Product not found in database");
      }

      // Khởi tạo thông tin sản phẩm
      let productName = existingProduct.product_name;
      let productPrice = existingProduct.product_price;
      let productImage = existingProduct.product_thumbnail ||
        (existingProduct.image_ids?.length > 0 ? existingProduct.image_ids[0] : null);
      let detailsVariantId = null;
      let variantInfo = null;

      // Nếu có biến thể, xử lý giá và tồn kho theo variant
      if (productInput.detailsVariantId) {
        const detailsVariant = await detailsVariantModel.findById(productInput.detailsVariantId);
        if (!detailsVariant) throw new NotFoundError("DetailsVariant not found");
        productPrice = detailsVariant.price;
        detailsVariantId = detailsVariant._id;
      }

      console.log("product quan cart", productInput.quantity);
      console.log("product variants", detailsVariantId);



      // Tạo sản phẩm để thêm vào giỏ
      const productToAdd = {
        productId: existingProduct._id,
        name: productName,
        price: productPrice,
        image: productImage,
        quantity: productInput.quantity || 1,
        isSelected: true,
        detailsVariantId: detailsVariantId,
      };

      // Nếu sản phẩm đã có trong giỏ -> cập nhật số lượng
      const isInCart = await CartService.isProductInCart({
        userId,
        productId: productToAdd.productId,
        detailsVariantId: productToAdd.detailsVariantId,
      });

      if (isInCart) {
        return await CartService.updateUserCartQuantity({
          userId,
          product: {
            productId: productToAdd.productId,
            quantity: productInput.quantity || 1,
            detailsVariantId: productToAdd.detailsVariantId,
          },
        });
      }

      // Kiểm tra số lượng âm
      if ((productInput.quantity || 1) < 0) {
        throw new ConflictRequestError("Cannot add product with negative quantity");
      }

      // Thêm mới vào giỏ hàng
      return await CartService.createUserCart({
        userId,
        product: productToAdd,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }


  //update cart
  static async updateUserCart({ userId, product }) {
    try {
      const userExists = await Account.exists({ _id: userId });
      if (!userExists) {
        throw new NotFoundError("User not found");
      }

      console.log("Updating user cart:", product.product);

      const { productId, quantity, detailsVariantId } = product.product;

      if (quantity === 0) {
        return await this.deleteUserCart({ userId, productId, variantId });
      }

      // Tìm thông tin sản phẩm từ database
      const existingProduct = await Products.findById(productId);
      console.log("existingProduct", productId);
      if (!existingProduct) {
        throw new NotFoundError("Product not found in database");
      }

      // Kiểm tra sản phẩm có trong giỏ hàng không - SỬA DÒNG NÀY
      console.log("Checking if product is in cart 2:", detailsVariantId);
      
      const isInCart = await CartService.isProductInCart({
        userId,
        productId,
        detailsVariantId,
      });

      if (!isInCart) {
        // Nếu sản phẩm không có trong giỏ hàng, thêm mới
        return await CartService.addToCart({
          userId,
          product: {
            productId,
            detailsVariantId,
            quantity,
          },
        });
      }

      // Tạo query tìm kiếm đúng sản phẩm
      const query = {
        cart_userId: userId,
        cart_state: "active",
      };

      // Sử dụng $elemMatch để đảm bảo tìm đúng sản phẩm
      if (detailsVariantId) {
        query["cart_products"] = {
          $elemMatch: {
            productId: productId,
            detailsVariantId: detailsVariantId, // ✅ Đúng theo schema mới
          },
        };
      }
      else {
        query["cart_products"] = {
          $elemMatch: {
            productId: productId,
            detailsVariantId: null, // Không có biến thể
          },
        };
      }

      // Cập nhật số lượng
      const updateSet = {
        $set: {
          "cart_products.$.quantity": quantity,
        },
      };

      const options = { new: true };
      return await cart.findOneAndUpdate(query, updateSet, options);
    } catch (error) {
      console.error("Error updating user cart:", error);
      throw error;
    }
  }
  //delete cart

  static async deleteUserCart({ userId, productId, variantId }) {
    try {
      const userExists = await Account.exists({ _id: userId });
      if (!userExists) {
        throw new NotFoundError("User not found");
      }




      const query = {
        cart_userId: userId,
        cart_state: "active",
      };

      let pullCondition = { productId };

      console.log("variantId", variantId);


      // Nếu có variantId, thêm điều kiện tìm kiếm
      if (variantId) {
        pullCondition = {
          productId,
          detailsVariantId: variantId, // ✅
        };
      } else {
        pullCondition = {
          productId,
          detailsVariantId: null, // Không có biến thể
        };
      }

      const updateSet = {
        $pull: {
          cart_products: pullCondition,
        },
      };

      console.log("pullCondition:", pullCondition);

      console.log("Delete cart query:", query);
      console.log("Delete cart updateSet:", updateSet);


      const deleteCart = await cart.updateOne(query, updateSet);
      console.log("Delete cart result:", deleteCart);

      return deleteCart;
    } catch (error) {
      console.error("Error deleting from cart:", error);
      throw error;
    }
  }

  //get cart
  static async getListUserCart({ userId }) {
    try {
      console.log("Getting cart for user:", userId);

      // Tìm giỏ hàng
      const userCart = await cart.findOne({
        cart_userId: userId,
        cart_state: "active",
      });

      if (!userCart) {
        return null;
      }

      console.log("Raw cart data:", JSON.stringify(userCart, null, 2));

      // Lấy danh sách productIds để truy vấn một lần
      const productIds = userCart.cart_products.map((item) => item.productId);
      console.log("Product IDs:", productIds);
      const detailsVariantIds = userCart.cart_products
        .map((item) => item.detailsVariantId)
        .filter(Boolean);

      // Lấy thông tin sản phẩm một lần
      const products = await Products.find(
        { _id: { $in: productIds } },
        {
          product_name: 1,
          product_price: 1,
          product_thumbnail: 1,
          image_ids: 1,
        }
      ).lean();

      console.log("Products found:", products.length);

      // Map sản phẩm theo ID để truy xuất nhanh
      const productMap = {};
      products.forEach((product) => {
        productMap[product._id.toString()] = product;
      });

      const DetailsVariant = require("../models/detailsVariant.model");
      const variants = await DetailsVariant.find({
        _id: { $in: detailsVariantIds },
      }).lean();

      const variantMap = {};
      variants.forEach((v) => {
        variantMap[v._id.toString()] = v;
      });


      // Làm giàu thông tin cart_products
      const enrichedProducts = userCart.cart_products.map((item) => {
        const productId = item.productId.toString();
        const variantId = item.detailsVariantId?.toString();
        const product = productMap[productId];
        const variant = variantId ? variantMap[variantId] : null;

        if (!product) {
          console.log(`Product ${productId} not found in database`);
          return item;
        }

        // Check the raw item first to see what we're working with
        console.log("Raw cart item:", JSON.stringify(item, null, 2));

        // Xác định variantId - kiểm tra cả hai vị trí có thể có
        // THAY ĐỔI QUAN TRỌNG: Kiểm tra item.variantId trước, sau đó mới kiểm tra item.variant?.variantId


        console.log(`Item ${productId} variantId: ${variantId}`);

        // Khởi tạo sản phẩm với thông tin cơ bản
        const enrichedItem = {
          productId: item.productId,
          name: product.product_name,
          price: variant?.price || product.product_price,
          image: item.image || product.product_thumbnail || product.image_ids?.[0],
          quantity: item.quantity,
          isSelected: item.isSelected,
          detailsVariantId: item.detailsVariantId,
        };


        // Nếu có variantId, tìm thông tin biến thể
        if (variant) {
          enrichedItem.variant = {
            variantId: variant._id,
            sku: variant.sku,
            values: variant.variantDetails, // [{ variantId, value }]
          };
        }

        return enrichedItem;
      });

      // Chuyển đổi giỏ hàng thành plain object
      const result = userCart.toObject();
      result.cart_products = enrichedProducts;

      console.log("Final enriched cart:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("Error getting user cart:", error);
      throw error;
    }
  }
}
module.exports = CartService;
