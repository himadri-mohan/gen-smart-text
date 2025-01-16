<script lang="ts">
    let tabs = ["1", "2"];
    let activeTab = 0;
  
    function selectTab(index: number) {
      activeTab = index;
    }
  </script>
  
  <style>
    .tabs {
      display: flex;
      border-bottom: 1px solid #ccc;
    }
  
    .tab {
      padding: 0.5rem 1rem;
      cursor: pointer;
      border: 1px solid #ccc;
      border-bottom: none;
      background-color: white;
    }
  
    .tab.active {
      background-color: #0073AA;
      color: white;
    }
  </style>
  
  <div class="tabs">
    {#each tabs as tab, index}
      <div
        class="tab {activeTab === index ? 'active' : ''}"
        on:click={() => selectTab(index)}
      >
        {tab}
      </div>
    {/each}
  </div>
  