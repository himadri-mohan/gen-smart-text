<script lang="ts">
	import Sidebar from './components/Sidebar.svelte';
	import Navbar from './components/Navbar.svelte';
	import TabNavigation from './components/TabNavigation.svelte';
	import MainContent from './components/MainContent.svelte';
  </script>
  
  <style>
	.layout {
	  display: flex;
	}
  
	.main {
	  flex-grow: 1;
	  display: flex;
	  flex-direction: column;
	}
  
	.content {
	  display: flex;
	  flex-grow: 1;
	}
  </style>
  
  <div class="layout">
	<!-- <Sidebar /> -->
	<div class="main">
	  <Navbar />
	  <TabNavigation />
	  <div class="content">
		<MainContent />
	  </div>
	</div>
  </div>
  