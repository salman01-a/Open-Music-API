import pool from "../../database/connection.js";
import { nanoid } from "nanoid";
import { validateAlbum } from "../../validator/albumsValidator.js";
import upload from "../../validator/UploadValidator.js";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();
const getAlbumById = async (req, res) => {
  const albumId = req.params.id;
  try {
    const result = await pool.query("SELECT * FROM albums WHERE id = $1", [
      albumId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Album not found",
      });
    }
    const songsResult = await pool.query(
      "SELECT id, title, performer FROM songs WHERE album_id = $1",
      [albumId]
    );
    const albumData = {
      ...result.rows[0],
      songs: songsResult.rows,
    };
    res.status(200).json({
      status: "success",
      data: { album: albumData },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const createAlbum = async (req, res) => {
  let uniqeId = nanoid(16);
  let albumId = `album-${uniqeId}`;
  const { error, value } = validateAlbum(req.body);
  if (error) {
    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
  const { name, year } = value;
  try {
    const result = await pool.query(
      "INSERT INTO albums (id, name, year) VALUES ($1, $2 ,$3) RETURNING id",
      [albumId, name, year]
    );

    if (result.rows.length === 0) {
      throw new Error("Error creating album");
    }

    res.status(201).json({
      status: "success",
      data: {
        albumId: result.rows[0].id,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const deleteAlbum = async (req, res) => {
  const albumId = req.params.id;
  try {
    const result = await pool.query(
      "DELETE FROM albums WHERE id = $1 RETURNING id",
      [albumId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Album not found",
      });
    }
    res.status(200).json({
      status: "success",
      message: `Album with ID ${albumId} deleted`,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const editAlbum = async (req, res) => {
  const albumId = req.params.id;
  const { error, value } = validateAlbum(req.body);
  if (error) {
    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
  const { name, year } = value;
  try {
    const result = await pool.query(
      "UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id",
      [name, year, albumId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Album not found",
      });
    }
    res.status(200).json({
      status: "success",
      message: `Album with ID ${albumId} updated`,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const uploadAlbumCoverHandler = (req, res) => {
  const { id: albumId } = req.params;

  upload.single("cover")(req, res, async (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ status: "fail", message: "Payload Too Large" });
    }
    if (err) return res.status(400).json({ status: "fail", message: err.message });

    if (!req.file) return res.status(400).json({ status: "fail", message: "Sampul wajib diunggah" });

    try {
      
      const coverUrl = `http://localhost:${process.env.PORT}/src/handler/album/cover_fileupload/${req.file.filename}`;
      const result = await pool.query(
        'UPDATE albums SET "coverUrl" = $1 WHERE id = $2 RETURNING id',
        [coverUrl, albumId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ status: "fail", message: "Album tidak ditemukan" });
      }
      return res.status(201).json({
        status: "success",
        message: "Sampul berhasil diunggah",
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  });
};


export { getAlbumById, createAlbum, deleteAlbum, editAlbum, uploadAlbumCoverHandler };
