import React, { useState } from "react";

function TerminalInterface() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSendCommand = async () => {
    try {
      const response = await fetch("/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: input }),
      });
      const data = await response.json();
      setOutput(data.result);
    } catch (error) {
      setOutput("Error executing command.");
    }
  };

  return (
    <div>
      <h1>Terminal</h1>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Enter command"
      />
      <button onClick={handleSendCommand}>Run</button>
      <div>
        <h2>Output</h2>
        <pre>{output}</pre>
      </div>
    </div>
  );
}

export default TerminalInterface;
