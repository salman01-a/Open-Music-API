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
        const collabCheck = await pool.query(
            "SELECT * FROM collaborators WHERE playlist_id = $1 AND user_id = $2",  
            [playlistId, owner]
        );

        ownerCheck.rows.push(...collabCheck.rows);
        if (ownerCheck.rows.length === 0){
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

        await pool.query(
            "INSERT INTO activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, NOW())",
            [`activity-${nanoid(16)}`, playlistId, songId, owner, 'add']
        );
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
        const collabCheck = await pool.query(
            "SELECT * FROM collaborators WHERE playlist_id = $1 AND user_id = $2",
            [playlistId, owner]
        );
        let isCollaborator = false;
        if (collabCheck.rows.length > 0) {
            isCollaborator = true;
        }
        const playlistRes = await pool.query(
            `SELECT p.id, p.name, p.owner_id, u.username
             FROM playlist p
             JOIN users u ON p.owner_id = u.id
             WHERE p.id = $1`,
            [playlistId]
        );
    
        if (playlistRes.rows.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Playlist not found",
            });
        }
    
        const playlistRow = playlistRes.rows[0];
        if (playlistRow.owner_id !== owner && !isCollaborator) {
            return res.status(403).json({
                status: "fail",
                message: "You don't have access to this playlist",
            });
        }
        const songsRes = await pool.query(
            `SELECT s.id, s.title, s.performer
             FROM playlist_song ps
             JOIN songs s ON ps.song_id = s.id
             WHERE ps.playlist_id = $1`,
            [playlistId]
        );
        const songs = songsRes.rows.map((r) => ({
            id: r.id,
            title: r.title,
            performer: r.performer,
        }));
    
        res.status(200).json({
            status: "success",
            data: {
                playlist: {
                    id: playlistRow.id,
                    name: playlistRow.name,
                    username: playlistRow.username,
                    songs: songs,
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
        const collabCheck = await pool.query(
            "SELECT * FROM collaborators WHERE playlist_id = $1 AND user_id = $2",
            [playlistId, owner]
        );
        let isCollaborator = false;
        if (collabCheck.rows.length > 0) {
            isCollaborator = true;
        }


        const ownerCheck = await pool.query(
            "SELECT * FROM playlist WHERE id = $1 AND owner_id = $2",
            [playlistId, owner]
        );
        if (ownerCheck.rows.length === 0 && !isCollaborator) {
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
        await pool.query(
            "INSERT INTO activities (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, NOW())",
            [`activity-${nanoid(16)}`, playlistId, songId, owner, 'delete']
        );
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