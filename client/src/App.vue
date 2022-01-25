<script lang="ts" setup>
import { io } from "socket.io-client";
import { ref, watch, computed, nextTick } from "vue";
import { useDark, useToggle, onStartTyping } from "@vueuse/core";
import { TYPING_TIMER_LENGTH, COLORS, SERVER_URL } from "@/config";
import { getRandomItem, formatDate } from "@/utils";

type Message = {
  username?: string;
  message: string;
  type: "default" | "system";
  date: string;
};
type Messages = Array<Message>;
type Users = Array<{
  username: string;
  id: string;
  room: string;
}>;

const isDark = useDark();
const toggleDark = useToggle(isDark);

const socket = io(SERVER_URL, {
  path: "/socket/",
  autoConnect: true,
});

const rooms = ["public", "aboba"];
const room = ref("public");

const connected = ref<boolean>(false);

const usernameInput = ref<string>("");
const users = ref<Users>([]);

const messages = ref<Messages>([]);
const messageInput = ref<string>("");

const chatList = ref<HTMLUListElement | null>();
const messageField = ref<HTMLInputElement | null>();
const usernameField = ref<HTMLInputElement | null>();

const typing = ref<boolean>(false);
const typingUsers = ref<Users>([]);
const lastTypingTime = ref();

const randomColor = computed(() => getRandomItem(COLORS));

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

function sendMessage() {
  if (messageInput.value && connected.value) {
    socket.emit("chatMessage", messageInput.value);
    messageInput.value = "";
  }
}

function joinRoom() {
  if (!usernameInput.value && !room.value) return;
  const roomValue = room.value;
  socket.emit("joinRoom", {
    username: usernameInput.value,
    room: roomValue,
  });
}

const changeRoom = (roomName: string) => {
  room.value = roomName;
  messages.value = [];
  socket.emit("change room", roomName);
};

onStartTyping(() => {
  if (connected.value) {
    if (messageField.value) {
      messageField.value.focus();
    }
  } else {
    if (usernameField.value) {
      usernameField.value.focus();
    }
  }
});

watch(messageInput, () => {
  if (connected.value) {
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
});
socket.on("login", () => {
  connected.value = true;
});
socket.on("roomUsers", (data) => {
  users.value = data.users;
});
socket.on("message", (message: Message) => {
  messages.value.push(message);
  scrollToBottom();
});
window.onbeforeunload = () => {
  socket.disconnect();
};

socket.on("typing", (data) => {
  typing.value = true;
  typingUsers.value = data.typingUsers;
});
socket.on("stop typing", (data) => {
  typing.value = false;
  typingUsers.value = data.typingUsers;
});
// socket.on("disconnect", () => {
//   socket.connect();
// });
// socket.io.on("reconnect", () => {
//   addSystemMessage("you have been reconnected");
//   if (username.value) {
//     socket.emit("add user", username.value);
//   }
// });
// socket.io.on("reconnect_error", () => {
//   addSystemMessage("attempt to reconnect has failed");
// });
</script>

<template>
  <main class="flex h-screen">
    <section
      class="m-auto md:w-3/4 lg:w-1/2 w-screen flex flex-col md:flex-row divide-x dark:divide-dark-800"
    >
      <template v-if="!connected">
        <div class="m-auto">
          <form @submit.prevent="joinRoom">
            <input
              ref="usernameField"
              type="text"
              v-model="usernameInput"
              placeholder="Enter username"
              class="input"
            />
          </form>
        </div>
      </template>
      <template v-else>
        <div class="md:w-4/5 dark:bg-gray-800-spotify bg-gray-100">
          <div>
            <ul class="flex flex-row gap-1 p-1">
              <li v-for="roomName in rooms" :key="roomName">
                <button class="btn-default" @click="changeRoom(roomName)">
                  <span :class="{ 'text-blue-500': roomName === room }">
                    {{ roomName }}
                  </span>
                </button>
              </li>
            </ul>
          </div>
          <div class="relative flex flex-col gap-5 w-full">
            <div class="absolute left-2 bottom-14.5">
              <div class="text-xxs">
                <template v-if="typing">
                  <span v-for="(user, index) in typingUsers" :key="user.id">
                    {{ user.username }} typing
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
                :key="index"
              >
                <li
                  class="flex flex-col justify-between p-2 rounded-md shadow-sm"
                  :class="[
                    [
                      username === usernameInput
                        ? 'bg-green-500 text-white self-end'
                        : `bg-white dark:bg-gray-600-spotify text-gray-700 dark:text-white self-start`,
                    ],
                    {
                      'self-center': type === 'system',
                    },
                  ]"
                >
                  <span
                    v-if="username !== usernameInput"
                    class="font-medium text-[13px]"
                    :style="{ color: randomColor }"
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
                <form @submit.prevent="joinRoom">
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
              <li v-for="{ id, username } in users" :key="id" class="leading-5">
                {{ username }}
              </li>
            </template>
            <template v-else>
              <span class="font-light leading-5"> no one here </span>
            </template>
          </ul>
        </div>
      </template>
    </section>
  </main>
  <footer class="fixed bottom-3 left-3">
    <div class="flex gap-2">
      <button class="btn-default" @click="toggleDark()">
        {{ isDark ? "Dark" : "Light" }}
      </button>
    </div>
  </footer>
</template>
