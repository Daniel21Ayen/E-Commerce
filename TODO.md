# FIX TODO - Orders 500 & Cart Validation 400

## Steps
- [x] 1. Create DB schema: `prisma db push` (tables missing — `public.users does not exist`)
- [x] 2. Fix `cartController.js`: `CartController.updateCartTotals` → `this.updateCartTotals` (4 places)
- [x] 3. Fix `wishlistController.js`: add `variants: true` to product include in `getWishlist`
- [x] 4. Fix `cartService.js`: `updateCartTotals` writes nonexistent `subtotal` — use `totalPrice`/`finalPrice`
- [x] 5. Re-seed database: `node src/utils/seedData.js` (4 users, 8 products, 3 orders)
- [ ] 6. Verify `GET /api/orders` and `POST /api/cart/items` work
