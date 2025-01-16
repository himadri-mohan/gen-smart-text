<script lang="ts">
    let groups = ["Intäkter", "Kostnader"];
    let accounts = ["Försäljning", "Marknadsföring"];
    let tabName = "";
    
    let formalText = "Omsättningen för december 2024 uppgick till 513 540 kr, en nedgång på 50 % jämfört med december 2023...";
    let negativeText = "December 2024 steg en dramatisk minskning med 50 %, ner från 1 027 530 kr i december 2023...";
    let optimisticText = "Trots en nedgång på 50 % i december till 513 540 kr, företaget har en imponerande ökning på 64 %...";
  </script>
  
  <style>
    .content {
      padding: 1rem;
      flex-grow: 1;
    }
  
    .text-option {
      margin-top: 1rem;
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 5px;
      background-color: #f9f9f9;
    }
  
    .select-button {
      margin-top: 1rem;
      background-color: #f9a825;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      cursor: pointer;
      border-radius: 5px;
    }
  
    .preview {
      border: 1px solid #ccc;
      padding: 1rem;
      margin-top: 1rem;
      border-radius: 5px;
    }
  
    .warning {
      margin-top: 1rem;
      background-color: #fff3cd;
      color: #856404;
      padding: 0.5rem;
      border: 1px solid #ffeeba;
      border-radius: 5px;
    }
  </style>
  
  <div class="content">
    <label>Ange fliknamn:</label>
    <input type="text" bind:value={tabName} placeholder="Ange fliknamn" />
  
    <label>Välj grupp:</label>
    <select>
      {#each groups as group}
        <option>{group}</option>
      {/each}
    </select>
  
    <label>Välj konto:</label>
    <select>
      {#each accounts as account}
        <option>{account}</option>
      {/each}
    </select>
  
    <button on:click={() => {}}>Generera smart text</button>
  
    <div class="text-option">
      <strong>Formell och analytisk</strong>
      <p>{formalText}</p>
    </div>
  
    <div class="text-option">
      <strong>Negativ och varnande</strong>
      <p>{negativeText}</p>
    </div>
  
    <div class="text-option">
      <strong>Optimistisk och framåtblickande</strong>
      <p>{optimisticText}</p>
    </div>
  
    <button class="select-button">Välj den lämpligaste texten ovan genom att klicka på den.</button>
  
    <div class="preview">
      <h3>Förhandsgranska</h3>
      <p>Visa presentation...</p>
    </div>
  
    <div class="warning">
      <p>Det verkar finnas ofullständiga sidor.</p>
      <p>Du bör se över och justera de sidor och flikar som har en röd ram runt sig innan du visar presentationen.</p>
    </div>
  </div>
  