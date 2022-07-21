let accessToken;
const clientId = "7fcfd3ad90884fd5b4c3ddc2b78d20a9";
const redirectUri = "http://localhost:3000/";

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken; 
        } 
        // Check for access token match
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
        // Clear parameters to get a new access token after it expires    
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location = accessUrl;
        }
    },
    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, { 
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }).then(response => {
            return response.json();
        }).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            }
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },
    savePlaylist(name, trackURIs) {
        if (!name || !trackURIs) {
            return;
        }
        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        // Get User ID
        let userId;
        return fetch("https://api.spotify.com/v1/me", { headers: headers}
        ).then(response => response.json()
        ).then(jsonResponse => {
            userId = jsonResponse.id;
        // Create Playlist and Get Playlist ID    
            return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, 
            {
                headers: headers,
                method: "POST",
                body: JSON.stringify({ name: name })
            }).then(response => response.json()
            ).then(jsonResponse => {
                const playlistId = jsonResponse.id;
        //  Add songs to created Playlist       
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
                {
                    headers: headers,
                    method: "POST",
                    body: JSON.stringify({ uris: trackURIs })
                })
            })
        })
    }
}

export default Spotify;