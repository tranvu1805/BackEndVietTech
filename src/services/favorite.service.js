const Favorite = require("../models/favorite.model");

class FavoriteService {
  static async addToFavorites(userId, productId) {
    return await Favorite.create({ user: userId, product: productId });
  }

  //test1
  static async removeFromFavorites(userId, productId) {
    return await Favorite.findOneAndDelete({ user: userId, product: productId });
  }

  static async getFavorites(userId) {
    return await Favorite.find({ user: userId }).populate("product");
  }
}

module.exports = FavoriteService;
