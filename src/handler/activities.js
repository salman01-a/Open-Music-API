
import pool from '../database/connection.js';
import { verifyAccessToken } from '../auth/jwt.js';


const getActivities = async (req, res) => {
if(req.headers.authorization === undefined){
        return res.status(401).json({
            status: "fail",
            message: "Missing authorization header",
        });
    }
    const bearerToken = req.headers.authorization.split(" ")[1];
    const owner = verifyAccessToken(bearerToken);
    const playlistId = req.params.playlistId;
    try{

        const ownerCheck = await pool.query(
            "SELECT * FROM playlist WHERE id = $1 AND owner_id = $2",
            [playlistId, owner]
        );
        const collabCheck = await pool.query(
            "SELECT * FROM collaborators WHERE playlist_id = $1 AND user_id = $2",  
            [playlistId, owner]
        );
        const playlistCheck = await pool.query(
            "SELECT * FROM playlist WHERE id = $1",
            [playlistId]
        );

        if (playlistCheck.rows.length === 0){
            return res.status(404).json({
                status: "fail",
                message: "Playlist not found",
            });
        }

        ownerCheck.rows.push(...collabCheck.rows);
        if (ownerCheck.rows.length === 0){
            return res.status(403).json({
                status: "fail",
                message: "Playlist not found or you don't have access",
            });
        }

        const result = await pool.query(
            `SELECT users.username, songs.title, activities.action, activities.time 
            FROM activities 
            JOIN users ON activities.user_id = users.id 
            JOIN songs ON activities.song_id = songs.id 
            WHERE activities.playlist_id = $1
            ORDER BY activities.time ASC`,
            [playlistId]
        );

        res.status(200).json({
            status: "success",
            data: {
                playlistId: playlistId,
                activities: result.rows,
            },
        });

    }catch(error){
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
}
export { getActivities };