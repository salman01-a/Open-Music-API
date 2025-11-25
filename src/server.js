import express from 'express'; 
import { createAlbum, getAlbumById, editAlbum, deleteAlbum} from './handler/album.js';
import {  addSong, getAllSongs, getSongById, editSongs, deleteSong } from './handler/song.js';
import { createUser} from './handler/user.js';
import { getToken, updateAccesToken, deleteRefreshToken } from './handler/auth.js';
import { createPlaylist, getPlaylist, deletePlaylist } from './handler/playlist.js';
import { addSongToPlaylist, getPlaylistSongs, deleteSongFromPlaylist } from './handler/playlist_song.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
//Endpoint Album
app.post('/albums', createAlbum);
app.get('/albums/:id', getAlbumById);
app.put('/albums/:id', editAlbum);
app.delete('/albums/:id', deleteAlbum); 

//Enndpoint Songs
app.post('/songs', addSong);
app.get('/songs', getAllSongs);
app.get('/songs/:id', getSongById);
app.put('/songs/:id', editSongs);
app.delete('/songs/:id', deleteSong);

//Endpoint User 
app.post('/users', createUser);
app.post('/authentications', getToken);
app.put('/authentications', updateAccesToken);
app.delete('/authentications', deleteRefreshToken);

//Endpoint Playlist
app.post('/playlists',createPlaylist );
app.get('/playlists', getPlaylist );
app.delete('/playlists/:playlistId', deletePlaylist);
app.post('/playlists/:playlistId/songs', addSongToPlaylist );
app.get('/playlists/:playlistId/songs', getPlaylistSongs );
app.delete('/playlists/:playlistId/songs', deleteSongFromPlaylist );

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});