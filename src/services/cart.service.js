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
class CartService {
  //Start Repo

  //Tạo mới giỏ hàng hoặc cập nhật giỏ hàng
  static async createUserCart({ userId, product }) {
    try {
      const query = {
        cart_userId: userId,
        cart_state: "active",
      };

      // Tạo cart_product với thông tin đầy đủ
      const productToAdd = {
        productId: product.productId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: product.quantity || 1,
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
  static async isProductInCart({ userId, productId, variantId }) {
    try {
      console.log("Checking if product in cart:", {
        userId,
        productId,
        variantId,
      });

      // Chuyển đổi kiểu dữ liệu để đảm bảo nhất quán
      const userIdObj = userId.toString();
      const productIdObj = productId.toString();
      const variantIdObj = variantId ? variantId.toString() : null;

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

      let foundProduct = false;

      for (const item of userCart.cart_products) {
        const itemProductId = item.productId.toString();
        console.log(`Comparing ${itemProductId} with ${productIdObj}`);

        if (itemProductId === productIdObj) {
          if (variantIdObj) {
            // Nếu truyền vào variantId, kiểm tra variant trùng khớp
            console.log(`Checking variant - looking for: ${variantIdObj}`);

            // Kiểm tra cả hai vị trí có thể có variantId
            const itemVariantId = item.variant?.variantId
              ? item.variant.variantId.toString()
              : item.variantId
              ? item.variantId.toString()
              : null;

            console.log(`Item variant ID: ${itemVariantId}`);

            if (itemVariantId === variantIdObj) {
              console.log("Found product with matching variant");
              foundProduct = true;
              break;
            }
          } else {
            // Nếu không truyền variantId, kiểm tra sản phẩm không có variant
            console.log("Looking for product without variant");

            const hasNoVariant =
              (!item.variant || !item.variant.variantId) && !item.variantId;
            console.log("Has no variant:", hasNoVariant);

            if (hasNoVariant) {
              console.log("Found product without variant");
              foundProduct = true;
              break;
            }
          }
        }
      }

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
      const { productId, quantity, variant } = product;

      // Chuyển đổi ID để so sánh
      const productIdStr = productId.toString();
      const variantIdStr = variant ? variant.variantId.toString() : null;

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
      let productIndex = -1;
      for (let i = 0; i < userCart.cart_products.length; i++) {
        const item = userCart.cart_products[i];
        const itemProductId = item.productId.toString();
        console.log(
          `Checking item ${i}: product ${itemProductId}, variant:`,
          item.variant
        );

        if (itemProductId === productIdStr) {
          if (variantIdStr) {
            // Có variant, kiểm tra variant trùng khớp
            console.log(`Looking for variant ${variantIdStr}`);
            if (
              item.variant &&
              item.variant.variantId &&
              item.variant.variantId.toString() === variantIdStr
            ) {
              console.log(`Found matching variant at index ${i}`);
              productIndex = i;
              break;
            }
          } else {
            // Không có variant, tìm sản phẩm không có variant
            console.log("Looking for product without variant");
            if (!item.variant || !item.variant.variantId) {
              console.log(`Found product without variant at index ${i}`);
              productIndex = i;
              break;
            }
          }
        }
      }

      console.log("Found product at index:", productIndex);

      if (productIndex === -1) {
        // Sử dụng getProductFromCart như một phương thức dự phòng
        console.log("Trying alternative lookup method");
        const matchingProduct = await CartService.getProductFromCart({
          userId,
          productId: productIdStr,
          variantId: variantIdStr,
        });

        if (!matchingProduct) {
          throw new NotFoundError("Product not found in cart");
        }

        // Tìm lại index sau khi đã xác nhận sản phẩm tồn tại
        for (let i = 0; i < userCart.cart_products.length; i++) {
          const item = userCart.cart_products[i];
          if (item._id.toString() === matchingProduct._id.toString()) {
            productIndex = i;
            break;
          }
        }

        if (productIndex === -1) {
          throw new NotFoundError("Product found but index location error");
        }
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

    let total = 0;
    currentCart.cart_products.forEach((e) => (total += e.price * e.quantity));

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

    const newBill = await billRepo.create({
      user_id: currentCart.cart_userId,
      products: currentCart.cart_products,
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

  static async addToCart({ userId, product = {} }) {
    try {
      console.log("Adding product to cart:", product);

      // Kiểm tra người dùng tồn tại
      const userExists = await Account.exists({ _id: userId });
      if (!userExists) {
        throw new NotFoundError("User not found");
      }

      // Tìm sản phẩm chính
      const existingProduct = await Products.findById(product.productId);
      if (!existingProduct) {
        throw new NotFoundError("Product not found in database");
      }

      console.log("Product from DB:", existingProduct);

      // Khởi tạo thông tin sản phẩm với dữ liệu từ sản phẩm chính
      let productName = existingProduct.product_name;
      let productPrice = existingProduct.product_price;
      let productImage =
        existingProduct.product_thumbnail ||
        (existingProduct.image_ids && existingProduct.image_ids.length > 0
          ? existingProduct.image_ids[0]
          : null);
      let variantInfo = null;

      // Nếu có variantId, tìm và lấy thông tin từ biến thể
      if (product.variantId && existingProduct.variations) {
        console.log(`Looking for variant: ${product.variantId}`);
        console.log(
          "Available variations:",
          existingProduct.variations.map((v) => v._id.toString())
        );

        // Tìm biến thể trong sản phẩm
        const variant = existingProduct.variations.find(
          (v) => v._id.toString() === product.variantId.toString()
        );

        console.log("Found variant:", variant);

        if (!variant) {
          throw new NotFoundError("Product variant not found");
        }

        // Cập nhật thông tin từ biến thể
        productPrice = variant.price || productPrice;

        // Lưu thông tin biến thể - THAY ĐỔI Ở ĐÂY, không lưu variantId riêng
        variantInfo = {
          variantId: variant._id,
          variant_name: variant.variant_name,
          variant_value: variant.variant_value,
          sku: variant.sku,
        };

        console.log("Variant price:", productPrice);
      }

      // Tạo đối tượng sản phẩm để thêm vào giỏ hàng
      const productToAdd = {
        productId: existingProduct._id,
        name: productName,
        price: productPrice,
        image: productImage,
        quantity: product.quantity || 1,
      };

      // Chỉ thêm thông tin biến thể nếu có
      if (variantInfo) {
        productToAdd.variant = variantInfo;
        // KHÔNG thêm productToAdd.variantId - chỉ lưu thông tin biến thể trong variant
      }

      console.log("Product to add:", productToAdd);

      // Sử dụng phương thức isProductInCart đã sửa
      const isInCart = await CartService.isProductInCart({
        userId,
        productId: productToAdd.productId,
        variantId: product.variantId,
      });

      console.log("Is product already in cart:", isInCart);

      if (isInCart) {
        // Nếu đã có trong giỏ hàng, cập nhật số lượng
        console.log("Product already in cart, updating quantity");
        return await CartService.updateUserCartQuantity({
          userId,
          product: {
            productId: productToAdd.productId,
            quantity: product.quantity || 1,
            variant: variantInfo,
          },
        });
      }

      // Nếu chưa có trong giỏ hàng, thêm mới
      console.log("Adding new product to cart");
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

      const { productId, quantity, variantId } = product;

      if (quantity === 0) {
        return await this.deleteUserCart({ userId, productId, variantId });
      }

      // Tìm thông tin sản phẩm từ database
      const existingProduct = await Products.findById(productId);
      if (!existingProduct) {
        throw new NotFoundError("Product not found in database");
      }

      // Kiểm tra sản phẩm có trong giỏ hàng không - SỬA DÒNG NÀY
      const isInCart = await CartService.isProductInCart({
        userId,
        productId,
        variantId,
      });

      if (!isInCart) {
        // Nếu sản phẩm không có trong giỏ hàng, thêm mới
        return await CartService.addToCart({
          userId,
          product: {
            productId,
            variantId,
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
      if (variantId) {
        query["cart_products"] = {
          $elemMatch: {
            productId: productId,
            "variant.variantId": variantId,
          },
        };
      } else {
        query["cart_products"] = {
          $elemMatch: {
            productId: productId,
            $or: [{ variant: { $exists: false } }, { variant: null }],
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

      // Nếu có variantId, thêm điều kiện tìm kiếm
      if (variantId) {
        pullCondition = {
          productId,
          "variant.variantId": variantId,
        };
      } else {
        // Nếu không có variantId, chỉ xóa sản phẩm không có biến thể
        pullCondition = {
          productId,
          variant: { $exists: false },
        };
      }

      const updateSet = {
        $pull: {
          cart_products: pullCondition,
        },
      };

      const deleteCart = await cart.updateOne(query, updateSet);
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

      // Lấy thông tin sản phẩm một lần
      const products = await Products.find(
        {
          _id: { $in: productIds },
        },
        {
          product_name: 1,
          product_price: 1,
          product_thumbnail: 1,
          image_ids: 1,
          variations: 1,
        }
      );

      console.log("Products found:", products.length);

      // Map sản phẩm theo ID để truy xuất nhanh
      const productMap = {};
      products.forEach((product) => {
        productMap[product._id.toString()] = product;
      });

      // Làm giàu thông tin cart_products
      const enrichedProducts = userCart.cart_products.map((item) => {
        const productId = item.productId.toString();
        const product = productMap[productId];

        if (!product) {
          console.log(`Product ${productId} not found in database`);
          return item;
        }

        // Check the raw item first to see what we're working with
        console.log("Raw cart item:", JSON.stringify(item, null, 2));

        // Xác định variantId - kiểm tra cả hai vị trí có thể có
        // THAY ĐỔI QUAN TRỌNG: Kiểm tra item.variantId trước, sau đó mới kiểm tra item.variant?.variantId
        const variantId = item.variantId
          ? item.variantId.toString()
          : item.variant?.variantId
          ? item.variant.variantId.toString()
          : null;

        console.log(`Item ${productId} variantId: ${variantId}`);

        // Khởi tạo sản phẩm với thông tin cơ bản
        const enrichedItem = {
          productId: item.productId,
          name: item.name || product.product_name,
          price: item.price || product.product_price,
          image:
            item.image || product.product_thumbnail || product.image_ids?.[0],
          quantity: item.quantity,
        };

        // Nếu có variantId, tìm thông tin biến thể
        if (variantId && product.variations && product.variations.length > 0) {
          console.log(
            `Looking for variant ${variantId} in product ${productId}`
          );
          console.log(
            "Available variations:",
            product.variations.map((v) => v._id.toString())
          );

          // Tìm biến thể
          const variant = product.variations.find(
            (v) => v._id.toString() === variantId
          );

          if (variant) {
            console.log(`Found variant in database:`, variant);

            // Thêm thông tin biến thể vào sản phẩm
            enrichedItem.variant = {
              variantId: variant._id,
              variant_name: variant.variant_name,
              variant_value: variant.variant_value,
              sku: variant.sku,
            };

            // LƯU Ý: Cập nhật giá từ biến thể
            if (variant.price) {
              console.log(
                `Updating price from ${enrichedItem.price} to ${variant.price}`
              );
              enrichedItem.price = variant.price;
            }
          } else {
            console.log(`Variant ${variantId} not found in product`);
          }
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
