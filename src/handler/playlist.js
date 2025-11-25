import pool from "../database/connection.js";
import { nanoid } from "nanoid";
import { validatePlaylist} from "../validator/playlistValidator.js";
import { verifyAccessToken } from "../auth/jwt.js";

const createPlaylist = async (req, res) => {
    if(req.headers.authorization === undefined){   
        return res.status(401).json({
            status: "fail",
            message: "Missing authorization header",
        });
    }
    
    const  bearerToken = req.headers.authorization.split(" ")[1];
    const owner = verifyAccessToken(bearerToken);  
    let uniqueId = nanoid(16);
    let playlistId = `playlist-${uniqueId}`;
    const { error, value } = validatePlaylist(req.body);
    if (error) {
        return res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    const {name} = value;

    try {
        const result = await pool.query(
        "INSERT INTO playlist (id, name, owner_id) VALUES ($1, $2 ,$3) RETURNING id",
        [playlistId, name, owner]
        );
    
        if (result.rows.length === 0) {
        throw new Error("Error creating playlist");
        }
    
        res.status(201).json({
        status: "success",
        data: {
            playlistId: result.rows[0].id,
        },
        });
    } catch (error) {
        res.status(500).json({
        status: "fail",
        message: error.message,
        });
    }
    };

const getPlaylist = async (req, res) => {
    if(req.headers.authorization === undefined){   
        return res.status(401).json({
            status: "fail",
            message: "Missing authorization header",
        });
    }
    const  bearerToken = req.headers.authorization.split(" ")[1];
    const owner = verifyAccessToken(bearerToken);
    try {
        const result = await pool.query(
            "SELECT playlist.id, playlist.name, users.username FROM playlist JOIN users ON playlist.owner_id = users.id WHERE owner_id = $1",
            [owner]
        );
        res.status(200).json({
            status: "success",
            data: {
                playlists: result.rows,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
};

const deletePlaylist = async (req, res) => {
    if(req.headers.authorization === undefined){    
        return res.status(401).json({
            status: "fail",
            message: "Missing authorization header",
        });
    }
    const  bearerToken = req.headers.authorization.split(" ")[1];
    const owner = verifyAccessToken(bearerToken);
    const playlistId= req.params.playlistId;
    try {
        const result  = await pool.query(
            "DELETE FROM playlist WHERE id = $1 AND owner_id = $2 RETURNING id",
            [playlistId, owner]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                status: "fail",
                message: "Playlist not found or you don't have access",
            });
        }
        res.status(200).json({
            status: "success",
            message: "Playlist deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }   
}

export { createPlaylist , getPlaylist , deletePlaylist};