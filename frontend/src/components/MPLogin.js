import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MPLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the form from refreshing the page

    try {
      // Send login credentials to the backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }), // Send username and password
      });

      const data = await response.json(); // Parse the response

      if (response.ok) {
        // Store the token in localStorage
        localStorage.setItem("authToken", data.token);

        // Redirect the user to the MP Dashboard
        navigate("/mp-dashboard");
      } else {
        // Handle login errors (e.g., invalid credentials)
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>MP Login</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleLogin} style={styles.form}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>Login</button>
      </form>
    </div>
  );
};

const styles = {
  container: { maxWidth: "300px", margin: "50px auto", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { width: "100%", padding: "8px", fontSize: "16px" },
  button: { backgroundColor: "#007BFF", color: "white", padding: "10px", border: "none", cursor: "pointer", width: "321px" },
  error: { color: "red" }
};

export default MPLogin;
