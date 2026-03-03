'use strict';

const bcrypt            = require('bcrypt');
const userRepository    = require('../repositories/userRepository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const ValidationError   = require('../exceptions/ValidationError');
const UnauthorizedError = require('../exceptions/UnauthorizedError');

async function register({ name, email, password, role = 'client' }) {
    if (!name || !email || !password) {
        throw new ValidationError('name, email and password are required');
    }
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ValidationError('Email already registered');

    const hashed = await bcrypt.hash(password, 12);
    const user   = await userRepository.create({ name, email, password: hashed, role });
    const accessToken  = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await userRepository.saveRefreshToken({ userId: user.id, token: refreshToken, expiresAt });

    return { user, accessToken, refreshToken };
}

async function login({ email, password }) {
    if (!email || !password) throw new ValidationError('email and password are required');

    const user = await userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const accessToken  = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await userRepository.saveRefreshToken({ userId: user.id, token: refreshToken, expiresAt });

    const { password: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
}

async function refreshToken(token) {
    if (!token) throw new ValidationError('Refresh token is required');

    const stored = await userRepository.findRefreshToken(token);
    if (!stored) throw new UnauthorizedError('Invalid or expired refresh token');

    verifyRefreshToken(token);

    const user        = await userRepository.findById(stored.user_id);
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });

    return { accessToken };
}

async function logout(token) {
    if (token) await userRepository.deleteRefreshToken(token);
}

module.exports = { register, login, refreshToken, logout };
