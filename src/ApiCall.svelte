<script>
  import { onMount } from "svelte";

  let response = null;
  let loading = false;
  let error = null;

  // Function to call the API
  async function callApi() {
    loading = true;
    error = null;

    try {
      const res = await fetch("https://api.example.com/data"); // Replace with your API URL
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      response = await res.json();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<style>
  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
  }
</style>

<div>
  <button on:click={callApi} disabled={loading}>
    {loading ? "Loading..." : "Call API"}
  </button>

  {#if error}
    <p style="color: red;">Error: {error}</p>
  {/if}

  {#if response}
    <pre>{JSON.stringify(response, null, 2)}</pre>
  {/if}
</div>
