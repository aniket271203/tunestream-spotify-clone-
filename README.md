---

## TuneStream

TuneStream is a Spotify clone that leverages the iTunes API to fetch songs, album covers, and other related information. This project demonstrates the integration of a third-party API to create a seamless music streaming experience.

### Features
- **Song Search**: Search for songs using the iTunes API.
- **Album Art**: Display high-quality album art retrieved from the iTunes API.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Hosted Online**: Accessible from anywhere with an internet connection.

### Project Structure
- `index.html`: The main HTML file.
- `css/`: Directory containing CSS files.
  - `utility.css`: Utility CSS for common styles.
  - `styles2.css`: Main stylesheet for the project.
- `js/`: Directory containing JavaScript files.
  - `script.js`: Main JavaScript file for functionality.
- `img/`: Directory containing images used in the project.
- `songs/`: Directory containing JSON files for various playlists and mixes.
  - `SpotifyPlaylists/`: Contains JSON files for different Spotify-like playlists.
  - `YourArtistMixes/`: Contains JSON files for artist-specific mixes.
  - `YourDecadeMixes/`: Contains JSON files for decade-specific mixes.

### How It Works
TuneStream uses the iTunes API to fetch data about songs and albums. The API provides comprehensive details, including track names, artist names, album artwork, and more. Here's how you can get started:

1. **Fetch Songs**: Use the iTunes Search API to retrieve song data.
   ```javascript
   const fetchSongs = async (query) => {
       const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song`);
       const data = await response.json();
       return data.results;
   };
   ```

2. **Get Album Images**: The API response includes URLs for album artwork which can be displayed in your app.
   ```html
   <img src="{albumArtUrl}" alt="Album Art">
   ```

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tunestream.git
   ```
2. Navigate to the project directory:
   ```bash
   cd tunestream
   ```
3. Install dependencies (if applicable):
   ```bash
   npm install
   ```
4. Start the development server (if applicable):
   ```bash
   npm start
   ```

### Live Demo
Check out the live version of TuneStream [here](https://mytunestream.freewebhostmost.com).

### Contributions
Contributions are welcome! Feel free to submit a pull request or open an issue to report bugs or suggest new features.

### License
This project is licensed under the MIT License.

---
