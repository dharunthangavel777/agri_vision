import { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { getProducts, saveProducts, getUsers } from '../../core/db.ts';
import { uploadDir } from '../../core/middleware/upload.ts';
import { AuthenticatedRequest } from '../../core/middleware/auth.ts';

export const createProduct = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, quantity, price, location, description, contactNumber, stockQuantity } = req.body;

    if (!name || !category || !quantity || !price || !location || !contactNumber || stockQuantity === undefined) {
      return res.status(400).json({ status: 'error', error: 'Missing required fields' });
    }
    if (Number(price) <= 0) {
      return res.status(400).json({ status: 'error', error: 'Price must be greater than 0' });
    }
    if (Number(stockQuantity) < 0 || !Number.isFinite(Number(stockQuantity))) {
      return res.status(400).json({ status: 'error', error: 'Stock quantity must be 0 or more' });
    }

    const products = getProducts();
    const newProduct = {
      productId: crypto.randomUUID(),
      name,
      category,
      quantity,
      price: Number(price),
      location,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      sellerId: req.user.userId,
      sellerName: req.user.identifier,
      contactNumber,
      stockQuantity: Number(stockQuantity),
      isSoldOut: Number(stockQuantity) === 0,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      priceUpdatedAt: null
    };

    products.push(newProduct);
    saveProducts(products);

    res.status(201).json({ status: 'ok', product: newProduct });
  } catch (error) {
    console.error('[API] Product creation error:', error);
    res.json({ status: 'ok', fallback: true, message: 'Failed to create product' });
  }
};

export const getProductsList = (req: Request, res: Response) => {
  try {
    const { name, category, location, minPrice, maxPrice } = req.query;
    let products = getProducts();

    if (name) {
      products = products.filter((p: any) => p.name.toLowerCase().includes((name as string).toLowerCase()));
    }
    if (category && category !== 'All') {
      products = products.filter((p: any) => p.category === category);
    }
    if (location) {
      products = products.filter((p: any) => p.location.toLowerCase().includes((location as string).toLowerCase()));
    }
    if (minPrice) {
      products = products.filter((p: any) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      products = products.filter((p: any) => p.price <= Number(maxPrice));
    }

    res.json({ 
      status: 'ok', 
      products: products.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
    });
  } catch (error) {
    console.error('[API] Fetch products error:', error);
    res.json({ status: 'ok', products: [], fallback: true, message: 'Failed to fetch products' });
  }
};

export const getProductById = (req: Request, res: Response) => {
  try {
    const products = getProducts();
    const product = products.find((p: any) => p.productId === req.params.id);
    if (!product) return res.status(404).json({ status: 'error', error: 'Product not found' });

    // Get seller info
    const users = getUsers();
    const seller = Object.values(users).find((u: any) => u.id === product.sellerId) as any;
    
    res.json({
      status: 'ok',
      product: {
        ...product,
        sellerInfo: seller ? {
          name: seller.name || seller.identifier,
          identifier: seller.identifier,
          location: seller.location
        } : null
      }
    });
  } catch (error) {
    console.error('[API] Fetch product detail error:', error);
    res.json({ status: 'ok', product: null, fallback: true, message: 'Failed to fetch product details' });
  }
};

export const getUserProducts = (req: Request, res: Response) => {
  try {
    const products = getProducts();
    const userProducts = products.filter((p: any) => p.sellerId === req.params.userId);
    res.json({ 
      status: 'ok', 
      products: userProducts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
    });
  } catch (error) {
    console.error('[API] Fetch user products error:', error);
    res.json({ status: 'ok', products: [], fallback: true, message: 'Failed to fetch user products' });
  }
};

export const updateProduct = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, quantity, price, location, description, contactNumber, stockQuantity } = req.body;
    let products = getProducts();
    const productIndex = products.findIndex((p: any) => p.productId === req.params.id);

    if (productIndex === -1) {
      return res.status(404).json({ status: 'error', error: 'Product not found' });
    }

    const existingProduct = products[productIndex];
    if (existingProduct.sellerId !== req.user.userId) {
      return res.status(403).json({ status: 'error', error: 'Unauthorized to edit this product' });
    }

    if (!name || !category || !quantity || !price || !location || !contactNumber || stockQuantity === undefined) {
      return res.status(400).json({ status: 'error', error: 'Missing required fields' });
    }
    if (Number(price) <= 0) {
      return res.status(400).json({ status: 'error', error: 'Price must be greater than 0' });
    }
    if (Number(stockQuantity) < 0 || !Number.isFinite(Number(stockQuantity))) {
      return res.status(400).json({ status: 'error', error: 'Stock quantity must be 0 or more' });
    }

    const normalizedPrice = Number(price);
    const normalizedStockQuantity = Number(stockQuantity);
    const updateTimestamp = new Date().toISOString();

    let image = existingProduct.image || null;
    if (req.file) {
      if (existingProduct.image) {
        const oldImagePath = path.join(uploadDir, path.basename(existingProduct.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = {
      ...existingProduct,
      name,
      category,
      quantity,
      price: normalizedPrice,
      location,
      description,
      contactNumber,
      stockQuantity: normalizedStockQuantity,
      isSoldOut: normalizedStockQuantity === 0,
      image,
      updatedAt: updateTimestamp,
      priceUpdatedAt: existingProduct.price !== normalizedPrice
        ? updateTimestamp
        : existingProduct.priceUpdatedAt || null
    };

    products[productIndex] = updatedProduct;
    saveProducts(products);

    res.json({ status: 'ok', product: updatedProduct, message: 'Product updated successfully' });
  } catch (error) {
    console.error('[API] Update product error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to update product' });
  }
};

export const deleteProduct = (req: AuthenticatedRequest, res: Response) => {
  try {
    let products = getProducts();
    const product = products.find((p: any) => p.productId === req.params.id);

    if (!product) return res.status(404).json({ status: 'error', error: 'Product not found' });
    if (product.sellerId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', error: 'Unauthorized to delete this product' });
    }

    // Remove image if exists
    if (product.image) {
      const imagePath = path.join(uploadDir, path.basename(product.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    products = products.filter((p: any) => p.productId !== req.params.id);
    saveProducts(products);

    res.json({ status: 'ok', message: 'Product deleted successfully' });
  } catch (error) {
    console.error('[API] Delete product error:', error);
    res.json({ status: 'ok', fallback: true, message: 'Failed to delete product' });
  }
};

export const updateInventory = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action } = req.body;
    let products = getProducts();
    const productIndex = products.findIndex((p: any) => p.productId === req.params.id);

    if (productIndex === -1) {
      return res.status(404).json({ status: 'error', error: 'Product not found' });
    }

    const existingProduct = products[productIndex];
    if (existingProduct.sellerId !== req.user.userId) {
      return res.status(403).json({ status: 'error', error: 'Unauthorized to update inventory' });
    }

    let stockQuantity = Number(existingProduct.stockQuantity ?? 0);
    let isSoldOut = !!existingProduct.isSoldOut;

    if (action === 'decrement') {
      if (stockQuantity <= 0) {
        return res.status(400).json({ status: 'error', error: 'Listing is already out of stock' });
      }
      stockQuantity -= 1;
      isSoldOut = stockQuantity === 0;
    } else if (action === 'sold-out') {
      stockQuantity = 0;
      isSoldOut = true;
    } else if (action === 'reactivate') {
      stockQuantity = Math.max(stockQuantity, 1);
      isSoldOut = false;
    } else {
      return res.status(400).json({ status: 'error', error: 'Invalid inventory action' });
    }

    const updatedProduct = {
      ...existingProduct,
      stockQuantity,
      isSoldOut,
      updatedAt: new Date().toISOString()
    };

    products[productIndex] = updatedProduct;
    saveProducts(products);

    res.json({ status: 'ok', product: updatedProduct, message: 'Inventory updated successfully' });
  } catch (error) {
    console.error('[API] Update inventory error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to update inventory' });
  }
};
