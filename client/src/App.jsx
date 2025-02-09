import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Callback from "./pages/Callback";
import Session from "./pages/Session";
import Home from "./pages/Home";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/session/:sessionId" element={<Session />} />
      </Routes>
    </Router>
  );
}

export default App;
