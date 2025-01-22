<script lang="ts">
  import { writable } from "svelte/store";

  let prompt = "";
  let response = writable<string | null>(null);
  let error = writable<string | null>(null);
  let loading = writable(false);
  const CLAUDE_API_URL = "https://api.anthropic.com/v1/completion";
  const CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY"; // Replace with your API key

  let creditsUsed = 0; // Store the amount of credits used for the API call

  // Function to call Claude AI's API
  async function generateText() {
    error.set(null);
    response.set(null);
    loading.set(true);

    try {
      const resp = await fetch("https://dummyjson.com/products", {
        method: "GET",
      });

      const data = await resp.json();

      console.log(data);
      response.set(data.limit);

      saveToFile({
        request: "test-request",
        response: data.completion,
      });
    } catch (err: any) {
      error.set(err.message || "An error occurred.");
    } finally {
      loading.set(false);
    }

    //   const body = JSON.stringify({
    //     prompt: `Assistant: ${prompt}\n\nUser:`,
    //     max_tokens: 100,
    //     model: "claude-2", // Specify the Claude model
    //     temperature: 0.7,
    //   });

    //   try {
    //     const res = await fetch(CLAUDE_API_URL, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         "Authorization": `Bearer ${CLAUDE_API_KEY}`,
    //       },
    //       body,
    //     });

    //     if (!res.ok) {
    //       throw new Error(`API Error: ${res.statusText}`);
    //     }

    //     const data = await res.json();
    //     response.set(data.completion || "No response generated.");

    //     // Assuming the API provides credit usage info in the response headers or body
    //     creditsUsed = res.headers.get("X-Credits-Used") || 1; // Replace with actual credit field

    //     saveToFile({
    //       request: JSON.parse(body),
    //       response: data.completion,
    //       creditsUsed,
    //     });
    //   } catch (err: any) {
    //     error.set(err.message || "An error occurred.");
    //   } finally {
    //     loading.set(false);
    //   }
  }

  // Function to save data to a file in the `public` folder
  function saveToFile(data: any) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element to download the file
    const a = document.createElement("a");
    a.href = url;
    a.download = "claude-api-log.json"; // File name
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

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

  .response,
  .error {
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
