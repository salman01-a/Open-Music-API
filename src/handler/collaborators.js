import pool from "../database/connection.js";
import { nanoid } from "nanoid";
import { verifyAccessToken } from "../auth/jwt.js";

const addCollaborator = async (req, res) => {
    if(req.headers.authorization === undefined){
        return res.status(401).json({
            status: "fail",
            message: "Missing authorization header",
        });
    }
    const bearerToken = req.headers.authorization.split(" ")[1];
    const owner = verifyAccessToken(bearerToken);
    const  playlistId  = req.body.playlistId;
    const  userId  = req.body.userId;
    const collaboratorId = `collab-${nanoid(16)}`;

    
    try {
        const userCheck = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [userId]
        );  
        const playlistCheck = await pool.query(
            "SELECT * FROM playlist WHERE id = $1",
            [playlistId] 
        );
        if (playlistCheck.rows.length === 0 ||   userCheck.rows.length === 0) {  
            return res.status(404).json({
                status: "fail",
                message: "Playlist or Users not found",
            });
        }
        const ownerCheck = await pool.query(
            "SELECT * FROM playlist WHERE id = $1 AND owner_id = $2",
            [playlistId, owner]
        );
        
        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({
                status: "fail",
                message: "You do not have permission to add collaborators to this playlist",    
            });
        }


        const result = await pool.query(
            "INSERT INTO collaborators (id, playlist_id, user_id) VALUES ($1, $2, $3) RETURNING id",
            [collaboratorId, playlistId, userId]
        );

        if (result.rows.length === 0) {
            throw new Error("Error adding collaborator");
        }

        res.status(201).json({
            status: "success",
            data: {
                collaborationId: result.rows[0].id,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
}

const removeCollaborator = async (req, res) => {
    if(req.headers.authorization === undefined){
        return res.status(401).json({
            status: "fail",
            message: "Missing authorization header",
        });
    }

    const bearerToken = req.headers.authorization.split(" ")[1];
    const owner = verifyAccessToken(bearerToken);
    const playlistId = req.body.playlistId;
    const userId  = req.body.userId;
    try {
        const checkOwner = await pool.query(
            "SELECT owner_id FROM playlist WHERE id = $1 AND owner_id = $2",
            [playlistId, owner]
        )
        console.log(checkOwner.rows);
        console.log(playlistId, owner)
        if(checkOwner.rows.length === 0){
            return res.status(403).json({
                status: "fail",
                message: "Acces Denied KOK ISO BANG",
            })
        }
        const result = await pool.query(
            "DELETE FROM collaborators WHERE playlist_id = $1 AND user_id = $2 RETURNING id",
            [playlistId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Collaborator not found",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Collaborator removed",
        });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message,
        });
    }
};

export { addCollaborator, removeCollaborator };