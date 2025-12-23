import ProducerService from "../service/ProducerService.js";
import pool from "../database/connection.js";
import { verifyAccessToken } from "../auth/jwt.js";

const exportMessageHandler = async (req, res) => {
  try {
    if (req.headers.authorization === undefined) {
      return res.status(401).json({
        status: "fail",
        message: "Missing authorization header",
      });
    }

    const bearerToken = req.headers.authorization.split(" ")[1];
    const userId = verifyAccessToken(bearerToken);
    const playlistId = req.params.playlistId;
    const { targetEmail } = req.body;

    console.log(userId, playlistId, targetEmail);

    if (!targetEmail) {
      return res.status(400).json({
        status: "fail",
        message: "targetEmail is required",
      });
    }

    const playlistCheck = await pool.query(
      "SELECT owner_id FROM playlist WHERE id = $1",
      [playlistId]
    );

    if (playlistCheck.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Playlist not found",
      });
    }
    console.log(playlistCheck.rows[0]);
    const playlist = playlistCheck.rows[0];
    if (playlist.owner_id !== userId) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have access to this playlist",
      });
    }

    const message = {
      playlistId,
      targetEmail,
    };

    await ProducerService.sendMessage(
      "export:playlists",
      JSON.stringify(message)
    );

    return res.status(201).json({
      status: "success",
      message: "Permintaan Anda sedang kami proses",
    });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
      });
    }
  }
};

export { exportMessageHandler };
