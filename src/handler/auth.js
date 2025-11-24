import pool from "../database/connection.js";
import { validateAuth, validateAuthToken } from "../validator/authValidator.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken} from "../auth/jwt.js";
import { nanoid } from "nanoid";

const getToken = async (req, res) => {
    const { error, value } = validateAuth(req.body);
    const authid = nanoid(16);
    if (error) {
        return res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    const { username, password } = value;
    try {
    const result = await pool.query(
        "SELECT id, password FROM users WHERE username = $1",
        [username]);
    if (result.rows.length === 0 || result.rows[0].password !== password) {
        return res.status(401).json({
        status: "fail",
        message: "Invalid username or password",
        });
    }
    const refreshTokenValue = generateRefreshToken({id: result.rows[0].id});
    const accessToken = generateAccessToken(result.rows[0].id);
    await pool.query(
        "INSERT INTO auth (id, token, user_id) VALUES ($1, $2, $3) RETURNING id",
        [authid,refreshTokenValue,result.rows[0].id]
    )
    res.status(201).json({
        status: "success",
        data: {
        accessToken,
        refreshToken : refreshTokenValue
        },
    }); 
    } catch (error) {
        res.status(500).json({
        status: "fail",
        message: error.message,
        });
    }
    }

const updateAccesToken = async (req, res) => { 
        const { error, value } = validateAuthToken(req.body);
        if (error) {
            return res.status(400).json({
            status: "fail",
            message: error.message,
            });
        }
        const { refreshToken } = value;
        try {
            const result = await pool.query(
                "SELECT token FROM auth WHERE token = $1",
                [refreshToken]
            );
            if (result.rows.length === 0) {
                return  res.status(400).json({
                    status: "fail",
                    message: "Refresh token not found",
                });
            }
            const refreshTokenValidate = verifyRefreshToken(refreshToken);
            const accessToken = generateAccessToken(refreshTokenValidate.id);
            res.status(200).json({
                status: "success",
                data: {
                    accessToken,
                },
            });
        } catch (error) {
            res.status(400).json({
                status: "fail",
                message: error.message,
            });
        }
    }  

const deleteRefreshToken = async (req, res) => {
    
    const { error, value } = validateAuthToken(req.body);
    if (error) {
        return res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    const { refreshToken } = value;
    try {
        const result = await pool.query(
            "DELETE FROM auth WHERE token = $1 RETURNING token",
            [refreshToken]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Refresh token not found",
            });
        }
        res.status(200).json({
            status: "success",
            message: "Refresh token deleted",
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
}

export { getToken, updateAccesToken, deleteRefreshToken };