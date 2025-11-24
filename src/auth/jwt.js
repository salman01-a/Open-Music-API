import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const generateAccessToken = (payload) => jwt.sign(payload, process.env.ACCESS_TOKEN_KEY);
const generateRefreshToken = (payload) => jwt.sign(payload, process.env.REFRESH_TOKEN_KEY);

const verifyAccessToken = (token) => jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.REFRESH_TOKEN_KEY);

export {generateAccessToken,generateRefreshToken, verifyAccessToken, verifyRefreshToken };