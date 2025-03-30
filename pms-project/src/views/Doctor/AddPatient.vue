<template>
    <h1 class="colored-text header-text">Add New Patient</h1>
    <form class="flex-column" action="">
        <input type="text" placeholder="Name">
        <input type="number" placeholder="Age">
        <select type="select" placeholder="Sex">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
        </select>
        <input type="text" placeholder="Blood Pressure">
        <input type="text" placeholder="Heart Rate">
        <input type="text" placeholder="Temperature">
        <input type="text" placeholder="Oxygen Saturation">
        <input type="text" placeholder="Respiratory Rate">
        <button>Add</button>
    </form>
</template>

<script>
export default {
    name: 'AddPatient'
}
</script>

<style scoped>
form {
    gap: 1em;
}

form input {
    width: 300px;
}
</style>