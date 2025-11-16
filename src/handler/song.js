import pool from "../database/connection.js";
import { nanoid } from "nanoid";
import { validateSong } from "../validator/songsValidator.js";


const addSong = async (req, res) => {
    let uniqeId = nanoid(16);
    let songId = `song_${uniqeId}`;
    const { error, value } = validateSong(req.body);
    if (error) {
        return res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    const { title, year, performer, genre, duration, albumId } = value;
    try {
        const result = await pool.query(
        "INSERT INTO songs (id, title, year, performer, genre, duration, album_id) VALUES ($1, $2 ,$3, $4, $5, $6, $7) RETURNING id",
        [songId, title, year, performer, genre, duration, albumId]
        );
    
        if (result.rows.length === 0) {
        throw new Error("Error creating song");
        }
    
        res.status(201).json({
        status: "success",
        data:{
            songId: result.rows[0].id
        }
        });
    } catch (error) {
        res.status(500).json({
        status: "fail",
        message: error.message,
        });
    }
    };

const getAllSongs = async (req, res) => {
    const { title, performer } = req.query;
    
    
    try {
        const result = await pool.query("SELECT * FROM songs WHERE title ILIKE $1 AND performer ILIKE $2", [title ? `%${title}%` : '%', performer ? `%${performer}%` : '%']);
        res.status(200).json({
            status: "success",
            data: {
                songs: result.rows.map((song) => ({
                    id: song.id,
                    title: song.title,
                    performer: song.performer,
                })),
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
};

const getSongById = async (req, res) => {
    const songId = req.params.id;

    try {
        const result = await pool.query("SELECT * FROM songs WHERE id = $1", [
            songId,
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Song not found",
            });
        }
        res.status(200).json({
            status: "success",
            data: { song: result.rows[0] },
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
}

const editSongs = async (req, res) => {
    const songId = req.params.id;
    const { error, value } = validateSong(req.body);
    if (error) {
        return res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    const { title, year, performer, genre, duration, albumId } = value;
    try {
        const result = await pool.query(
        "UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING id",
        [title, year, performer, genre, duration, albumId, songId]
        );
    
        if (result.rows.length === 0) {
        return res.status(404).json({
            status: "fail",
            message: "Song not found",
        });
        }
    
        res.status(200).json({
        status: "success",
        message: "Song updated successfully",
        });
    } catch (error) {
        res.status(500).json({
        status: "fail",
        message: error.message,
        });
    }
    };

const deleteSong = async (req, res) => {
    const songId = req.params.id;
    try {
        const result = await pool.query(
        "DELETE FROM songs WHERE id = $1 RETURNING id",
        [songId]
        );
    
        if (result.rows.length === 0) {
        return res.status(404).json({
            status: "fail",
            message: "Song not found",
        });
        }
    
        res.status(200).json({
        status: "success",
        message: "Song deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
        status: "fail",
        message: error.message,
        });
    }
    }

export { addSong, getAllSongs, getSongById, editSongs, deleteSong };
