import React, { useState } from "react";

// Example 1: Simple dependency between fields
const SimpleDependencyForm = () => {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [availableCities, setAvailableCities] = useState([]);

  const countries = {
    RU: ["Moscow", "Saint Petersburg", "Kazan"],
    UA: ["Kyiv", "Lviv", "Odesa"],
    US: ["New York", "Los Angeles", "Chicago"],
  };

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setCountry(selectedCountry);
    setCity("");
    setAvailableCities(countries[selectedCountry] || []);
  };

  return (
    <div
      style={{
        marginBottom: "30px",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>Example 1: Simple "Country → City" Dependency</h3>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Country:
          <select
            value={country}
            onChange={handleCountryChange}
            style={{ marginLeft: "10px" }}
          >
            <option value="">Select country</option>
            <option value="RU">Russia</option>
            <option value="UA">Ukraine</option>
            <option value="US">USA</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>
          City:
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!availableCities.length}
            style={{ marginLeft: "10px" }}
          >
            <option value="">
              {availableCities.length ? "Select city" : "Select country first"}
            </option>
            {availableCities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {city && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#f0f8ff",
            borderRadius: "4px",
          }}
        >
          <strong>Selected:</strong>{" "}
          {countries[country] ? countries[country].find((c) => c === city) : ""}{" "}
          ({country})
        </div>
      )}
    </div>
  );
};

// Example 2: Chain dependency
const ChainDependencyForm = () => {
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [experience, setExperience] = useState("");
  const [availablePositions, setAvailablePositions] = useState([]);
  const [availableExperienceLevels, setAvailableExperienceLevels] = useState(
    [],
  );

  const departments = {
    IT: [
      "Frontend Developer",
      "Backend Developer",
      "DevOps Engineer",
      "QA Engineer",
    ],
    HR: ["HR Manager", "Recruiter", "HR Business Partner"],
    Sales: ["Sales Manager", "Account Executive", "Sales Director"],
  };

  const experienceLevels = {
    "Frontend Developer": ["Junior", "Middle", "Senior", "Lead"],
    "Backend Developer": ["Junior", "Middle", "Senior", "Lead"],
    "DevOps Engineer": ["Middle", "Senior", "Lead"],
    "QA Engineer": ["Junior", "Middle", "Senior"],
    "HR Manager": ["Middle", "Senior"],
    Recruiter: ["Junior", "Middle"],
    "HR Business Partner": ["Senior", "Lead"],
    "Sales Manager": ["Junior", "Middle", "Senior"],
    "Account Executive": ["Middle", "Senior"],
    "Sales Director": ["Senior", "Lead"],
  };

  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;
    setDepartment(selectedDepartment);
    setPosition("");
    setExperience("");
    setAvailablePositions(departments[selectedDepartment] || []);
    setAvailableExperienceLevels([]);
  };

  const handlePositionChange = (e) => {
    const selectedPosition = e.target.value;
    setPosition(selectedPosition);
    setExperience("");
    setAvailableExperienceLevels(experienceLevels[selectedPosition] || []);
  };

  return (
    <div
      style={{
        marginBottom: "30px",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>
        Example 2: Chain Dependency "Department → Position → Experience Level"
      </h3>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Department:
          <select
            value={department}
            onChange={handleDepartmentChange}
            style={{ marginLeft: "10px" }}
          >
            <option value="">Select department</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Position:
          <select
            value={position}
            onChange={handlePositionChange}
            disabled={!availablePositions.length}
            style={{ marginLeft: "10px" }}
          >
            <option value="">
              {availablePositions.length
                ? "Select position"
                : "Select department first"}
            </option>
            {availablePositions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Experience Level:
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            disabled={!availableExperienceLevels.length}
            style={{ marginLeft: "10px" }}
          >
            <option value="">
              {availableExperienceLevels.length
                ? "Select experience level"
                : "Select position first"}
            </option>
            {availableExperienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      {experience && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#f0fff0",
            borderRadius: "4px",
          }}
        >
          <strong>Profile:</strong> {position} ({experience}) in {department}{" "}
          department
        </div>
      )}
    </div>
  );
};

// Example 3: Conditional field visibility
const ConditionalVisibilityForm = () => {
  const [userType, setUserType] = useState("individual");
  const [hasCompany, setHasCompany] = useState(false);
  const [companyName, setCompanyName] = useState("");

  return (
    <div
      style={{
        marginBottom: "30px",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>Example 3: Conditional Field Visibility</h3>

      <div style={{ marginBottom: "15px" }}>
        <label>
          User Type:
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </label>
      </div>

      {userType === "business" && (
        <>
          <div style={{ marginBottom: "15px" }}>
            <label>
              <input
                type="checkbox"
                checked={hasCompany}
                onChange={(e) => setHasCompany(e.target.checked)}
                style={{ marginRight: "10px" }}
              />
              I have a registered company
            </label>
          </div>

          {hasCompany && (
            <div style={{ marginBottom: "15px" }}>
              <label>
                Company Name:
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{ marginLeft: "10px", padding: "5px", width: "300px" }}
                  placeholder="Enter company name"
                />
              </label>
            </div>
          )}
        </>
      )}

      <div
        style={{
          marginTop: "15px",
          padding: "10px",
          backgroundColor: "#fff0f0",
          borderRadius: "4px",
        }}
      >
        <strong>Current status:</strong>{" "}
        {userType === "individual" ? "Individual" : "Business"}
        {hasCompany && companyName && ` (${companyName})`}
      </div>
    </div>
  );
};

// Example 4: Calculated values
const CalculatedForm = () => {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(100);
  const [discount, setDiscount] = useState(0);

  const subtotal = quantity * price;
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  return (
    <div
      style={{
        marginBottom: "30px",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3>Example 4: Automatic Value Calculation</h3>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Quantity:
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            style={{ marginLeft: "10px", width: "80px" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Price per unit:
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) =>
              setPrice(Math.max(0, parseFloat(e.target.value) || 0))
            }
            style={{ marginLeft: "10px", width: "100px" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Discount (%):
          <input
            type="range"
            min="0"
            max="50"
            value={discount}
            onChange={(e) => setDiscount(parseInt(e.target.value))}
            style={{ marginLeft: "10px", width: "200px" }}
          />
          <span style={{ marginLeft: "10px" }}>{discount}%</span>
        </label>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
        }}
      >
        <div>
          <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
        </div>
        <div>
          <strong>Discount amount:</strong> ${discountAmount.toFixed(2)}
        </div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#007bff",
            marginTop: "10px",
          }}
        >
          <strong>Total:</strong> ${total.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

// Main component
export const App = () => {
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Dependent Form Fields Demo</h1>
      <p>Each form demonstrates different types of field dependencies:</p>

      <SimpleDependencyForm />
      <ChainDependencyForm />
      <ConditionalVisibilityForm />
      <CalculatedForm />

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3>Benefits of Dependent Fields:</h3>
        <ul>
          <li>
            <strong>Improved UX:</strong> Fields become available only when
            relevant
          </li>
          <li>
            <strong>Real-time validation:</strong> Dependent values update
            automatically
          </li>
          <li>
            <strong>Reduced errors:</strong> Users cannot select incompatible
            values
          </li>
          <li>
            <strong>Contextual hints:</strong> Fields appear only when needed
          </li>
          <li>
            <strong>Automatic calculation:</strong> Calculated values update
            instantly
          </li>
        </ul>
      </div>
    </div>
  );
};

export default App;
