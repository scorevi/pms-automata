<template>
    <li v-for="appointment in upcomingAppointments" :key="appointment.id">
        {{ formatDate(appointment.appointmentDate) }} - 
        {{ formatTime(appointment.appointmentTime) }} : 
        {{ appointment.reason || 'N/A' }} ({{ appointment.status || 'N/A' }})
    </li>
</template>