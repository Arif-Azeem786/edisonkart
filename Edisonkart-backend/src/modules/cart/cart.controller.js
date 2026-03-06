const Cart = require('./cart.model');
const Product = require('../product/product.model');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

const cartController = {
  // Get user cart
  async getCart(req, res, next) {
    try {
      let cart = await Cart.findOne({ userId: req.user.userId })
        .populate('items.productId', 'name price discountPrice stock imageIds slug isActive variants hasVariants variantAttributes');

      if (!cart) {
        cart = await Cart.create({
          userId: req.user.userId,
          items: []
        });
      }

      // Validate items and update prices if needed
      const updatedItems = [];
      for (const item of cart.items) {
        const product = item.productId;
        if (product && product.isActive) {
          let inStock = product.stock > 0;
          if (item.variantId && product.variants?.length) {
            const variant = product.variants.find(v => v._id?.toString() === item.variantId?.toString());
            inStock = variant ? variant.stock > 0 : inStock;
          }
          if (inStock) {
            const currentPrice = product.discountPrice || product.price;
            if (item.priceSnapshot !== currentPrice) {
              item.priceSnapshot = currentPrice;
            }
            updatedItems.push(item);
          }
        }
      }

      if (updatedItems.length !== cart.items.length) {
        cart.items = updatedItems;
        await cart.save();
      }

      const total = cart.getTotal();

      successResponse(res, {
        items: cart.items,
        total,
        itemCount: cart.items.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Add to cart
  async addItem(req, res, next) {
    try {
      const { productId, variantId, quantity = 1 } = req.body;

      // Check product
      const product = await Product.findOne({
        _id: productId,
        isActive: true
      });

      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      let price = product.discountPrice || product.price;
      let stock = product.stock;

      // If variantId is provided, find the variant and update price/stock
      if (variantId && product.hasVariants) {
        const variant = product.variants.id(variantId);
        if (!variant) {
          return errorResponse(res, 'Product variant not found', 404);
        }
        price = variant.discountPrice || variant.price;
        stock = variant.stock;
      }

      if (stock < quantity) {
        return errorResponse(res, 'Product not available in requested quantity', 400);
      }

      let cart = await Cart.findOne({ userId: req.user.userId });

      if (!cart) {
        cart = new Cart({
          userId: req.user.userId,
          items: []
        });
      }

      // Check if item already in cart (same product AND same variant)
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId && 
                (variantId ? item.variantId?.toString() === variantId.toString() : !item.variantId)
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        if (newQuantity > stock) {
          return errorResponse(res, `Only ${stock} items available in stock`, 400);
        }
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].priceSnapshot = price;
      } else {
        // Add new item
        cart.items.push({
          productId,
          variantId: variantId || null,
          quantity,
          priceSnapshot: price
        });
      }

      await cart.save();

      const total = cart.getTotal();

      successResponse(res, {
        items: cart.items,
        total,
        itemCount: cart.items.length
      }, 'Item added to cart');
    } catch (error) {
      next(error);
    }
  },

  // Update cart item quantity
  async updateItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (quantity < 1) {
        return errorResponse(res, 'Quantity must be at least 1', 400);
      }

      const cart = await Cart.findOne({ userId: req.user.userId });
      if (!cart) {
        return errorResponse(res, 'Cart not found', 404);
      }

      const item = cart.items.id(itemId);
      if (!item) {
        return errorResponse(res, 'Item not found in cart', 404);
      }

      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return errorResponse(res, 'Product is no longer available', 400);
      }
      let availableStock = product.stock;
      if (item.variantId && product.hasVariants) {
        const variant = product.variants.id(item.variantId);
        if (variant) availableStock = variant.stock;
      }
      if (quantity > availableStock) {
        return errorResponse(res, `Only ${availableStock} items available`, 400);
      }

      item.quantity = quantity;
      await cart.save();

      const total = cart.getTotal();

      successResponse(res, {
        items: cart.items,
        total,
        itemCount: cart.items.length
      }, 'Cart updated');
    } catch (error) {
      next(error);
    }
  },

  // Remove item from cart
  async removeItem(req, res, next) {
    try {
      const { itemId } = req.params;

      const cart = await Cart.findOne({ userId: req.user.userId });
      if (!cart) {
        return errorResponse(res, 'Cart not found', 404);
      }

      cart.items.pull(itemId);
      await cart.save();

      const total = cart.getTotal();

      successResponse(res, {
        items: cart.items,
        total,
        itemCount: cart.items.length
      }, 'Item removed from cart');
    } catch (error) {
      next(error);
    }
  },

  // Clear cart
  async clearCart(req, res, next) {
    try {
      const cart = await Cart.findOne({ userId: req.user.userId });
      if (cart) {
        cart.items = [];
        await cart.save();
      }

      successResponse(res, null, 'Cart cleared');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = cartController;