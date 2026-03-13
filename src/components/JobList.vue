<script setup lang="ts">
import { useJobStore } from '../stores/useJobStore';

const jobStore = useJobStore();
</script>

<template>
    <div class="section-card">
        <h3>Lista de Candidaturas</h3>
        <div v-if="jobStore.loading">Cargando...</div>
        <table v-else>
            <thead>
                <tr>
                    <th>Empresa</th>
                    <th>Puesto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="job in jobStore.jobs" :key="job.id">
                    <td>{{ job.empresa }}</td>
                    <td>{{ job.puesto }}</td>
                    <td>
                        <select :value="job.estado"
                            @change="(e) => jobStore.updateJobStatus(job.id!, (e.target as HTMLSelectElement).value)">
                            <option value="CV Enviado">CV Enviado</option>
                            <option value="Entrevista Técnica">Entrevista Técnica</option>
                            <option value="Rechazada">Rechazada</option>
                        </select>
                    </td>
                    <td>
                        <button @click="jobStore.deleteJob(job.id!)" class="btn-delete">Borrar</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>