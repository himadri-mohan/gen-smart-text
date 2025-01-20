<script lang="ts">
    import { writable } from "svelte/store";
  
    // Stores for response, error, and loading state
    let prompt = "";
    let response = writable<string | null>(null);
    let error = writable<string | null>(null);
    let loading = writable(false);
  
    const CLAUDE_API_URL = "https://api.anthropic.com/v1/completion";
    const CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY"; // Replace with your actual API key
  
    // Function to call Claude AI's API
    async function generateText() {
      error.set(null);
      response.set(null);
      loading.set(true);
  
      const body = JSON.stringify({
        prompt: `Assistant: ${prompt}\n\nUser:`,
        max_tokens: 100,
        model: "claude-2", // Specify the Claude model
        temperature: 0.7,
      });
  
      try {
        const res = await fetch(CLAUDE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${CLAUDE_API_KEY}`,
          },
          body,
        });
  
        if (!res.ok) {
          throw new Error(`API Error: ${res.statusText}`);
        }
  
        const data = await res.json();
        response.set(data.completion || "No response generated.");
      } catch (err: any) {
        error.set(err.message || "An error occurred.");
      } finally {
        loading.set(false);
      }
    }
  </script>
  
  <style>
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 1rem;
    }
  
    textarea {
      width: 100%;
      height: 100px;
      margin-bottom: 1rem;
      padding: 0.5rem;
    }
  
    button {
      padding: 0.5rem 1rem;
      font-size: 16px;
      cursor: pointer;
    }
  
    .response, .error {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 5px;
    }
  
    .response {
      background-color: #f0f8ff;
      color: #333;
    }
  
    .error {
      background-color: #ffe6e6;
      color: #cc0000;
    }
  </style>
  
  <div class="container">
    <h1>Claude AI Text Generator</h1>
  
    <textarea bind:value={prompt} placeholder="Enter your prompt..."></textarea>
    <button on:click={generateText} disabled={$loading}>
      {$loading ? "Generating..." : "Generate Text"}
    </button>
  
    {#if $response}
      <div class="response">
        <h3>Response:</h3>
        <p>{$response}</p>
      </div>
    {/if}
  
    {#if $error}
      <div class="error">
        <h3>Error:</h3>
        <p>{$error}</p>
      </div>
    {/if}
  </div>
  