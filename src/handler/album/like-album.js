import pool from "../../database/connection.js";
import { verifyAccessToken } from "../../auth/jwt.js";
import { nanoid } from "nanoid";
import CacheService from "../../service/CacheService.js";
const CacheServiceInstance = new CacheService();
const likeAlbumHandler = async (req, res) => {
  if (req.headers.authorization === undefined) {
    return res.status(401).json({
      status: "fail",
      message: "Missing authorization header",
    });
  }
  const bearerToken = req.headers.authorization.split(" ")[1];
  const userId = verifyAccessToken(bearerToken);
  const albumId = req.params.id;
  try {
    const queryAlbum = await pool.query("SELECT * FROM albums WHERE id = $1", [
      albumId,
    ]);
    if (queryAlbum.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Album not found",
      });
    }
    const checkLike = await pool.query(
      "SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2",
      [userId, albumId]
    );
    if (checkLike.rows.length > 0) {
      return res.status(400).json({
        status: "fail",
        message: "Album already liked",
      });
    }

    const uniqueId = nanoid(16);
    const likeId = `like-${uniqueId}`;
    await pool.query(
      "INSERT INTO user_album_likes (id, user_id, album_id) VALUES ($1, $2, $3)",
      [likeId, userId, albumId]
    );
    return res.status(201).json({
      status: "success",
      message: "Album liked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const unlikeAlbumHandler = async (req, res) => {
  if (req.headers.authorization === undefined) {
    return res.status(401).json({
      status: "fail",
      message: "Missing authorization header",
    });
  }
  const bearerToken = req.headers.authorization.split(" ")[1];
  const userId = verifyAccessToken(bearerToken);
  const albumId = req.params.id;
  try {
    const queryAlbum = await pool.query("SELECT * FROM albums WHERE id = $1", [
      albumId,
    ]);
    if (queryAlbum.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Album not found",
      });
    }
    await pool.query(
      "DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2",
      [userId, albumId]
    );
    await CacheServiceInstance.delete(`album_likes:${albumId}`);
    return res.status(200).json({
      status: "success",
      message: "Album unliked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const countAlbumLikesHandler = async (req, res) => {
  const albumId = req.params.id;
  const cacheKey = `album_likes:${albumId}`;

  try {
    const cacheLike = await CacheServiceInstance.get(`album_likes:${albumId}`);
    if (cacheLike) {
      res.setHeader("X-Data-Source", "cache");
      return res.status(200).json({
        status: "success",
        data: {
          likes: parseInt(cacheLike, 10),
        },
      });
    }
  } catch (error) {
    console.error("Cache error:", error.message);
  }
  try {
    const queryAlbum = await pool.query("SELECT * FROM albums WHERE id = $1", [
      albumId,
    ]);
    if (queryAlbum.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Album not found",
      });
    }
    const result = await pool.query(
      "SELECT COUNT(*) AS like_count FROM user_album_likes WHERE album_id = $1",
      [albumId]
    );
    const likeCount = parseInt(result.rows[0].like_count, 10);
    res.setHeader("X-Data-Source", "database");
    await CacheServiceInstance.set(cacheKey, likeCount);
    return res.status(200).json({
      status: "success",
      data: {
        likes: likeCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
export { likeAlbumHandler, unlikeAlbumHandler, countAlbumLikesHandler };
