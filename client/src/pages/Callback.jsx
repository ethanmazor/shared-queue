import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Callback.css";

function Callback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL
        const params = new URLSearchParams(location.search);
        const code = params.get("code");

        // Get stored code verifier
        const codeVerifier = localStorage.getItem("code_verifier");

        if (!code) {
          console.error("No code found in URL");
          setError("Missing authorization code");
          return;
        }

        if (!codeVerifier) {
          console.error("No code verifier found");
          setError("Missing code verifier");
          return;
        }

        console.log("Sending auth request to server...");
        console.log(`${import.meta.env.VITE_API_URL}/auth/callback`);

        // Exchange code for tokens
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/callback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              code_verifier: codeVerifier,
            }),
          }
        );

        const contentType = response.headers.get("content-type");
        if (!response.ok) {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error("Server response not OK:", errorData);
            throw new Error(
              errorData.error || "Failed to authenticate with Spotify"
            );
          } else {
            const errorText = await response.text();
            console.error("Server response not OK and not JSON:", errorText);
            throw new Error(
              "Failed to authenticate with Spotify and received non-JSON response"
            );
          }
        }

        const data = await response.json();
        console.log("Authentication successful");

        // Clear code verifier from storage
        localStorage.removeItem("code_verifier");

        // Generate session ID
        const sessionId = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

        // Store auth data if needed
        localStorage.setItem("spotify_user_id", data.user.id);

        // Navigate to session
        console.log("Navigating to session:", sessionId);
        navigate(`/session/${sessionId}`, { replace: true });
      } catch (error) {
        console.error("Detailed authentication error:", error);
        setError(error.message || "Authentication failed");
      }
    };

    handleCallback();
  }, [navigate, location]);

  if (error) {
    return (
      <div className="callback-container">
        <div className="error-message">
          <h2>Authentication Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/")} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="callback-container">
      <div className="loading-spinner"></div>
      <p>Connecting to Spotify...</p>
    </div>
  );
}

export default Callback;
