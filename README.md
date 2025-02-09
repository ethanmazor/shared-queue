# Music Jam 🤘

A collaborative music session app that lets users create and join music sessions, vote on genres, and queue songs together using Spotify.

## Prerequisites

Before you begin, ensure you have:
- Node.js (v16 or higher)
- npm (Node Package Manager)
- MongoDB installed locally or a MongoDB Atlas account
- Spotify Developer account with registered application

## Environment Setup

1. **Create Spotify Application**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new application
   - Add `http://localhost:5173/callback` to Redirect URIs
   - Note down your Client ID and Client Secret

2. **Set up Environment Variables**

   Create `client/.env`:
   ```plaintext
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_API_URL=http://localhost:5000
   ```

   Create `server/.env`:
   ```plaintext
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=your_mongodb_connection_string
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   CLIENT_URL=http://localhost:5173
   OPENAI_API_KEY=your_openai_api_key
   ```

## Installation

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd music-jam
   ```

2. **Install Client Dependencies**
   ```
   cd client
   npm install
   ```

3. **Install Server Dependencies**
   ```
   cd ../server
   npm install
   ```

## Running the Application

1. **Start the Server**
   cd server
   npm run dev
   ```

2. **Start the Client**
   cd client
   npm run dev
   ```

3. **Access the Application**
   - Open your browser and navigate to `http://localhost:5173`

## Tech Stack

- **Frontend**:
  - React
  - Tailwind CSS
  - Socket.io-client
  - Spotify Web Playback SDK

- **Backend**:
  - Node.js
  - Express
  - Socket.io
  - MongoDB
  - OpenAI API

## Development

- Use `npm run dev` for development with hot-reload
- Server runs on port 5000
- Client runs on port 5173

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.