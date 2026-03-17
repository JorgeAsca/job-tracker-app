<script setup lang="ts">
import { onMounted } from 'vue';
import { useJobStore } from './stores/useJobStore';
import JobForm from './components/JobForm.vue';
import JobList from './components/JobList.vue';
import UmlArchitect from './components/UmlArchitect.vue'; 
import SpriteForge from './components/SpriteForge.vue'; 
import './assets/styles.css';

const jobStore = useJobStore();

onMounted(() => {
  jobStore.fetchJobs();
});
</script>

<template>
  <div class="container">
    <header>
      <h1>Gestor de Proyecto Asíncronos</h1>
    </header>

    <section class="section-container">
      <JobForm />
      <JobList />
    </section>

    <section class="section-container">
      <UmlArchitect />
    </section>

    <section class="section-container">
      <SpriteForge />
    </section>
  </div>
</template>

<!-- <style scoped>
.section-container {
  margin-bottom: 40px;
  padding: 20px;
  border-bottom: 2px solid #eee;
}
</style> -->