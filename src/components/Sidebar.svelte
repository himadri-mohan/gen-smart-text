<script lang="ts">
    let menuItems = ["Översikt", "Presentationer", "Skapa presentation", "Mallar"];
  </script>
  
  <style>
    nav {
      background-color: #333;
      color: white;
      padding: 1rem;
      height: 100vh;
      width: 200px;
    }
  
    ul {
      list-style: none;
      padding: 0;
    }
  
    li {
      margin: 1rem 0;
      cursor: pointer;
    }
  
    li:hover {
      text-decoration: underline;
    }
  </style>
  
  <nav>
    <ul>
      {#each menuItems as item}
        <li>{item}</li>
      {/each}
    </ul>
  </nav>
  