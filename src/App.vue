<script setup lang="ts">
import { onMounted } from 'vue';
import { useJobStore } from './stores/useJobStore';
import JobForm from './components/JobForm.vue';
import JobList from './components/JobList.vue';
import './assets/styles.css';

const jobStore = useJobStore();

onMounted(() => {
  jobStore.fetchJobs();
});
</script>

<template>
  <div class="container">
    <header>
      <h1>💼 Job Tracker Pro</h1>
      <p>Gestión asíncrona de candidaturas (Vue 3 + TS)</p>
    </header>

    <JobForm />
    <JobList />
  </div>
</template>