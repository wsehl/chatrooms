<script setup lang="ts">
import { io } from "socket.io-client";

const socket = io("/", {
  path: "/socket/",
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("connected with socket id", socket.id);
});
</script>

<template>
  <router-view />
</template>
