'use strict';

class CreateSaleDTO {
    constructor({ clientId, productId, saleDate, quantity, unitPrice }) {
        this.clientId  = parseInt(clientId);
        this.productId = parseInt(productId);
        this.saleDate  = saleDate?.trim();
        this.quantity  = parseInt(quantity);
        this.unitPrice = parseFloat(unitPrice);
    }
}

module.exports = CreateSaleDTO;
