const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Route za preuzimanje videa
app.get('/download', async (req, res) => {
    try {
        const videoURL = decodeURIComponent(req.query.url);

        if (!videoURL) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log('Fetching video info for:', videoURL);

        // Dohvati informacije o videu
        const info = await ytdl.getInfo(videoURL);
        const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });

        // Postavi zaglavlja za preuzimanje
        res.setHeader('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        // Koristimo fluent-ffmpeg za obradu videa
        ffmpeg()
            .input(ytdl(videoURL, { format: videoFormat }))
            .format('mp4')
            .on('error', (err) => {
                console.error('Error processing video:', err.message);
                res.status(500).json({ error: 'Something went wrong', details: err.message });
            })
            .on('end', () => {
                console.log('Video processing completed.');
            })
            .pipe(res, { end: true });
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({ error: 'Something went wrong', details: error.message });
    }
});

// Pokretanje servera
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
