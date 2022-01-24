import { defineConfig } from "windicss/helpers";
import colors from "windicss/colors";

export default defineConfig({
  darkMode: "class",
  shortcuts: {
    "default-focus": "outline-none focus:outline-none",
    btn: "default-focus rounded-full px-3 py-1 w-auto disabled:cursor-not-allowed",
    "btn-default": "btn dark:bg-gray-700-spotify bg-gray-100",
    "btn-danger": "btn bg-red-500 !text-white",
    input:
      "default-focus dark:bg-gray-700-spotify bg-gray-100 px-4 py-2 rounded-full w-full",
  },
  theme: {
    extend: {
      colors: {
        ...colors,
        "gray-1000-spotify": "#080707",
        "gray-950-spotify": "#191414",
        "gray-900-spotify": "#121212",
        "gray-800-spotify": "#1d1d1d",
        "gray-700-spotify": "#282828",
        "gray-600-spotify": "#333333",
        "gray-500-spotify": "#ABABAB",
        "gray-450-spotify": "#535353",
        "gray-400-spotify": "#bfbfbf",
      },
      fontSize: {
        xxs: "0.7rem",
      },
    },
  },
});
