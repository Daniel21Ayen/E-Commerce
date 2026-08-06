# FIX TODO - Orders 500 & Cart Validation 400

## Steps
- [ ] 1. Fix `productController.getProduct` slug lookup (avoid P2023 UUID cast crash)
- [ ] 2. Relax cart `addItem` validator (`productId`/`variantId` accept string IDs)
- [ ] 3. Re-seed database to restore valid UUID primary keys
- [ ] 4. Verify `GET /api/orders` and `POST /api/cart/items` work
