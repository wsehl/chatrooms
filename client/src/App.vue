<script lang="ts" setup>
import { io } from "socket.io-client";
import { ref, watch, computed, nextTick, onMounted } from "vue";
import { useDark, useToggle, useStorage, useTimeAgo } from "@vueuse/core";
import { TYPING_TIMER_LENGTH, COLORS, SERVER_URL } from "@/config";
import { getRandomItem } from "@/utils";

type Message = {
  username?: string;
  message: string;
  type: "default" | "system";
  date: string;
};
type Messages = Array<Message>;
type Users = Array<string>;
type Store = {
  username: string;
};

const store = useStorage("store", {
  username: "",
} as Store);
const connected = ref<Boolean>(false);
const typing = ref<Boolean>(false);
const typingUsername = ref<string>("");
const messages = ref<Messages>([]);
const users = ref<Users>([]);
const typingUsers = ref<Users>([]);
const usernameInput = ref<string>("");
const messageInput = ref<string>("");
const chatList = ref<HTMLUListElement | null>();
const messageField = ref<HTMLInputElement | null>();
const lastTypingTime = ref();
const usernameColor = computed(() => getRandomItem(COLORS));
const isDark = useDark();
const toggleDark = useToggle(isDark);

const socket = io(SERVER_URL, {
  path: "/socket/",
  autoConnect: true,
});

function formatDate(date: Date | string) {
  const timeAgo = useTimeAgo(date);
  return timeAgo.value;
}
function scrollToBottom() {
  nextTick(() => {
    if (chatList.value) {
      const el = chatList.value.lastElementChild;
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "end", inline: "end" });
      }
    }
  });
}
function addMessage(message: Message) {
  messages.value.push(message);
}
function addSystemMessage(message: string) {
  addMessage({
    message: message,
    type: "system",
    date: new Date().toISOString(),
  });
}
function sendMessage() {
  if (messageInput.value && connected.value) {
    socket.emit("new message", messageInput.value);
    messageInput.value = "";
  }
}
function joinChat(username: string) {
  if (!username) return;
  socket.emit("add user", username);
  store.value.username = username;
  usernameInput.value = "";
}
function exitChat() {
  socket.emit("logout");
  connected.value = false;
  store.value.username = "";
}

if (store.value.username) {
  joinChat(store.value.username);
}
window.onbeforeunload = () => {
  socket.disconnect();
};

watch(messageInput, () => {
  if (connected) {
    if (!typing.value) {
      socket.emit("typing");
    }
    lastTypingTime.value = new Date().getTime();
    setTimeout(() => {
      const typingTimer = new Date().getTime();
      const timeDiff = typingTimer - lastTypingTime.value;
      if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
        socket.emit("stop typing");
        typing.value = false;
      }
    }, TYPING_TIMER_LENGTH);
  }
});

socket.on("connect", () => {
  console.log("connected with socket id", socket.id);
  socket.emit("init");
});
socket.on("get users", ({ activeUsers }) => {
  users.value = activeUsers;
});
socket.on("login", ({ activeUsers }) => {
  connected.value = true;
  users.value = activeUsers;
  addSystemMessage("Welcome to chatrooms");
  nextTick(() => {
    if (messageField.value) {
      messageField.value.focus();
    }
  });
});
socket.on("new message", (data) => {
  addMessage(data);
  scrollToBottom();
});
socket.on("user joined", ({ username, activeUsers }) => {
  addSystemMessage(`${username} joined`);
  users.value = activeUsers;
});
socket.on("user left", ({ username, activeUsers }) => {
  addSystemMessage(`${username} left`);
  users.value = activeUsers;
});
socket.on("typing", (data) => {
  typing.value = true;
  typingUsername.value = data.username;
  typingUsers.value = data.typingUsers;
});
socket.on("stop typing", (data) => {
  typing.value = false;
  typingUsername.value = data.username;
  typingUsers.value = data.typingUsers;
});
socket.on("disconnect", () => {
  addSystemMessage("you have been disconnected");
});
socket.io.on("reconnect", () => {
  addSystemMessage("you have been reconnected");
  if (usernameInput.value) {
    socket.emit("add user", usernameInput.value);
  }
});
socket.io.on("reconnect_error", () => {
  addSystemMessage("attempt to reconnect has failed");
});
</script>

<template>
  <main class="flex h-screen">
    <section
      class="m-auto md:w-3/4 lg:w-1/2 w-screen flex flex-col md:flex-row border-1 divide-x dark:border-dark-200 dark:divide-dark-800"
    >
      <div class="md:w-4/5 dark:bg-gray-800-spotify bg-gray-100">
        <div class="relative flex flex-col gap-5 w-full">
          <div class="absolute left-2 bottom-14.5">
            <div class="text-xxs">
              <template v-if="typing">
                <span v-for="(user, index) in typingUsers" :key="user">
                  {{ user }} typing
                  <span v-if="index !== typingUsers.length - 1">,&nbsp;</span>
                </span>
              </template>
            </div>
          </div>
          <ul
            ref="chatList"
            class="flex flex-col gap-2 rounded-tl w-full h-96 px-2 overflow-auto"
          >
            <template
              v-for="({ message, username, type, date }, index) in messages"
            >
              <li
                class="flex flex-col justify-between p-2 rounded-md shadow-sm"
                :class="[
                  [
                    username === store.username
                      ? 'bg-green-500 text-white self-end'
                      : `bg-white dark:bg-gray-600-spotify text-gray-700 dark:text-white self-start`,
                  ],
                  {
                    'self-center': type === 'system',
                  },
                ]"
              >
                <span
                  v-if="username !== store.username"
                  class="font-medium text-[13px]"
                  :style="{ color: usernameColor }"
                >
                  {{ username }}
                </span>
                <p
                  class="break-all font-normal"
                  :class="[type === 'system' ? 'text-xxs' : 'text-sm']"
                >
                  {{ message }}
                </p>
                <span class="text-[10px] font-light text-right">
                  {{ formatDate(date) }}
                </span>
              </li>
            </template>
          </ul>
          <div class="block bg-white dark:bg-dark-800 p-2">
            <template v-if="!connected">
              <form @submit.prevent="joinChat(usernameInput)">
                <input
                  type="text"
                  v-model="usernameInput"
                  placeholder="Enter username"
                  class="input"
                />
              </form>
            </template>
            <template v-else>
              <form @submit.prevent="sendMessage">
                <input
                  ref="messageField"
                  type="text"
                  v-model="messageInput"
                  placeholder="Type message"
                  class="input"
                />
              </form>
            </template>
          </div>
        </div>
      </div>
      <div class="md:w-1/5 p-2 dark:bg-dark-700 bg-gray-100">
        <span class="font-semibold">online</span>
        <ul class="w-full flex flex-col mt-1.5">
          <template v-if="users.length">
            <li class="leading-5" v-for="user in users" :key="user">
              {{ user }}
            </li>
          </template>
          <template v-else>
            <span class="font-light leading-5"> no one here </span>
          </template>
        </ul>
      </div>
    </section>
  </main>
  <footer class="absolute bottom-3 left-3">
    <div class="flex gap-2">
      <button class="btn-default" @click="toggleDark()">
        {{ isDark ? "Dark" : "Light" }}
      </button>
      <button v-if="connected" class="btn-danger" @click="exitChat()">
        Logout
      </button>
    </div>
  </footer>
</template>
