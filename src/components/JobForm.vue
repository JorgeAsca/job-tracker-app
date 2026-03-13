<script setup lang="ts">
import { ref } from 'vue';
import { useJobStore } from '../stores/useJobStore';
import "../assets/job-tracker.css";


const jobStore = useJobStore();
const empresa = ref('');
const puesto = ref('');

const agregar = async () => {
    if (empresa.value && puesto.value) {
        await jobStore.addJob({
            empresa: empresa.value,
            puesto: puesto.value,
            estado: 'CV Enviado'
        });
        empresa.value = '';
        puesto.value = '';
    }
};
</script>

<template>
    <div class="section-card">
        <h3>Nueva Candidatura</h3>
        <form @submit.prevent="agregar" class="job-form">
            <input v-model="empresa" placeholder="Nombre de la empresa" required />
            <input v-model="puesto" placeholder="Puesto (ej: Frontend)" required />
            <button type="submit" class="btn-primary">Añadir</button>
        </form>
    </div>
</template>