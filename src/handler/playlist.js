import pool from "../database/connection.js";
import { nanoid } from "nanoid";
import { validatePlaylist } from "../validator/playlistsValidator.js";

const createPlaylist = async (req, res) => {
    let uniqueId = nanoid(16);
    let playlistId = `playlist-${uniqueId}`;
    const { error, value } = validatePlaylist(req.body);
    if (error) {
        return res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    const { name, owner } = value;
    try {
        const result = await pool.query(
        "INSERT INTO playlists (id, name, owner) VALUES ($1, $2 ,$3) RETURNING id",
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