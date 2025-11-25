import pool from "../database/connection.js";
import { nanoid } from "nanoid";
import {validatePlaylistSong} from "../validator/playlistValidator.js";
import { verifyAccessToken } from "../auth/jwt.js";

const addSongToPlaylist = async (req, res) => {
    if(req.headers.authorization === undefined){   
        return res.status(401).json({
            status: "fail",
            message: "Missing authorization header",
        });
    }
    const  bearerToken = req.headers.authorization.split(" ")[1];   
    const owner = verifyAccessToken(bearerToken);

    const { error, value } = validatePlaylistSong(req.body);
    if (error) {
        return res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    const id = 'playlist-song-'+nanoid(16);

    const { songId } = value;
    const playlistId= req.params.playlistId;

    try {
        const songCheck= await pool.query(
            "SELECT * FROM songs WHERE id = $1",
            [songId]
        );
        if (songCheck.rows.length === 0) {
            return  res.status(404).json({
                status: "fail",
                message: "Song not found",
            });
        }
        const ownerCheck = await pool.query(
            "SELECT * FROM playlist WHERE id = $1 AND owner_id = $2",
            [playlistId, owner]
        );
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({
                status: "fail",
                message: "Playlist not found or you don't have access",
            });
        }
        const result = await pool.query(
            "INSERT INTO playlist_song (id, playlist_id, song_id) VALUES ($1, $2, $3) RETURNING id",
            [id, playlistId, songId]
        )
        if (result.rows.length === 0) {
            throw new Error("Error adding song to playlist");
        }
        res.status(201).json({
            status: "success",
            message: "Song added to playlist",
        }); 
    }
    catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
};

const getPlaylistSongs = async (req, res) => {
    if(req.headers.authorization === undefined){   
        return res.status(401).json({
            status: "fail",
            message: "Missing authorization header",
        });
    }
    const  bearerToken = req.headers.authorization.split(" ")[1];   
    const owner = verifyAccessToken(bearerToken);
    // console.log(typeof owner);
    const playlistId= req.params.playlistId;

    try {
        const playlistCheck = await pool.query(
            "SELECT * FROM playlist WHERE id = $1",
            [playlistId]
        );
        if (playlistCheck.rows.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Playlist not found",
            });
        }
        
        const ownerCheck = await pool.query(
            "SELECT * FROM playlist WHERE id = $1 AND owner_id = $2",   
            [playlistId, owner]
        );
        if (ownerCheck.rows[0].owner_id !== owner )  {
            return res.status(403).json({
                status: "fail",
                message: "Playlist not found or you don't have access",
            });
        }
        const result = await pool.query(
        `SELECT songs.id,songs.title,songs.performer, users.username, playlist.name
        FROM playlist JOIN playlist_song ON playlist.id = playlist_song.playlist_id 
        JOIN songs ON playlist_song.song_id = songs.id JOIN users 
        ON playlist.owner_id = users.id WHERE playlist.id = $1 AND playlist.owner_id = $2`,
        [playlistId, owner]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                status: "fail",
                message: "Playlist not found or you don't have access",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                playlist: {
                    id: playlistId,
                    name: result.rows[0].name,
                    username: result.rows[0].username,
                    songs: result.rows.map((row) => ({
                        id: row.id,
                        title: row.title,
                        performer: row.performer,
                    })),
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
};

const deleteSongFromPlaylist = async (req, res) => {
  if(req.headers.authorization === undefined){   
      return res.status(401).json({
          status: "fail",
          message: "Missing authorization header",
      });
  }
    const  bearerToken = req.headers.authorization.split(" ")[1];
    const owner = verifyAccessToken(bearerToken);
    const { error, value } = validatePlaylistSong(req.body);
    if (error) {
        return res.status(400).json({
        status: "fail",
        message: error.message,
        });
    }
    const { songId } = value;
    const playlistId= req.params.playlistId;

    try {   
        const ownerCheck = await pool.query(
            "SELECT * FROM playlist WHERE id = $1 AND owner_id = $2",
            [playlistId, owner]
        );
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({
                status: "fail",
                message: "Playlist not found or you don't have access",
            });
        }
        const result = await pool.query(
            "DELETE FROM playlist_song WHERE playlist_id = $1 AND song_id = $2 returning id",
            [playlistId, songId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Song not found in playlist",
            });
        }
        res.status(200).json({
            status: "success",
            message: "Song deleted from playlist",
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }


};

export { addSongToPlaylist, getPlaylistSongs, deleteSongFromPlaylist };