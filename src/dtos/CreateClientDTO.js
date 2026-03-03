'use strict';

class CreateClientDTO {
    constructor({ name, email, password, phone, address }) {
        this.name     = name?.trim();
        this.email    = email?.trim().toLowerCase();
        this.password = password;
        this.phone    = phone?.trim();
        this.address  = address?.trim();
    }
}

module.exports = CreateClientDTO;
