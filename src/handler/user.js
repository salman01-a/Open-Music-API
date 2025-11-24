import pool from "../database/connection.js";
import {validateUser} from "../validator/usersValidator.js";
import {generateRefreshToken} from "../auth/jwt.js";
import {nanoid} from "nanoid";

const createUser = async (req, res) => {
    const { error, value } = validateUser(req.body);
    if (error) {
        return res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    const { username, password, fullname } = value;
    const userId = `user-${nanoid(16)}`;
    const refreshToken = generateRefreshToken({userId});
    const authid = `auth-${nanoid(16)}`;
    try {
    const result = await pool.query(
        "INSERT INTO users (id, username, password, fullname) VALUES ($1, $2 ,$3, $4) RETURNING id",
        [userId, username, password, fullname]);

    if (result.rows.length === 0) {
        throw new Error("Error creating user");
        }

    const insertRefreshToken = await pool.query(
        "INSERT INTO auth (id, token, user_id) VALUES ($1, $2,$3) RETURNING id",
        [authid, refreshToken, userId]
    );

    if (insertRefreshToken.rows.length === 0) {
        throw new Error("Error storing refresh token");
    }
    res.status(201).json({
        status: "success",
        data: {
            userId: result.rows[0].id,
        },
    });
    } catch (error) {
        res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    };



export { createUser };