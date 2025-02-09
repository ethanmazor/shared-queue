const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your client's URL
  })
);

app.post("/auth/callback", (req, res) => {
  const { code, code_verifier } = req.body;
  // Handle the authentication logic here
  // For example, exchange the code for tokens with Spotify
  res.json({ user: { id: "example_user_id" } });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
