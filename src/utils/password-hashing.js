import bcrypt from 'bcrypt';
import {logger} from '../config/winston.js';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
    if (!password) throw new Error('Password is required');
    try {
        return bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
        logger.error(`Hashing Error: ${error.message}`);
        throw error;
    }
};

export const isMatch = async (password, hashedPassword) => {
    if (!password || !hashedPassword) throw new Error('Both password and hash are required');
    try {
        return bcrypt.compare(password, hashedPassword);
    } catch (error) {
        logger.error(`Compare Error: ${error.message}`);
        throw error;
    }
};