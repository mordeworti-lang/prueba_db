'use strict';

class LoginDTO {
    constructor({ email, password }) {
        this.email    = email?.trim().toLowerCase();
        this.password = password;
    }
}

module.exports = LoginDTO;
