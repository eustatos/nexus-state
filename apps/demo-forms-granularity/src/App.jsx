import React, { useState } from "react";

export const App = () => {
  // Granular state for each form field
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [description, setDescription] = useState("");

  // Functions to update individual fields
  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleAgeChange = (e) => {
    setAge(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ name, email, age, description });
    alert("Form submitted! Check the console for details.");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Granular Form Field Management Demo</h1>
      <p>
        Each field updates independently without re-rendering the entire form
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="name">Name:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          <p>Value: {name}</p>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          <p>Value: {email}</p>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="age">Age:</label>
          <input
            id="age"
            type="number"
            value={age}
            onChange={handleAgeChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          <p>Value: {age}</p>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            rows="4"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
          <p>Value: {description}</p>
        </div>

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Submit
        </button>
      </form>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
        }}
      >
        <h3>Benefits of Granular Approach:</h3>
        <ul>
          <li>Each field updates independently</li>
          <li>Minimized component re-renders</li>
          <li>Improved performance with large forms</li>
          <li>Easier tracking of individual field changes</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
