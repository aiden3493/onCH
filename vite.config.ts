import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/search": {
        target: "https://www.onch3.co.kr/idx_search_main.php",
        changeOrigin: true,
        secure: false,
      },
      "/detail": {
        target: "https://www.onch3.co.kr/onch_view.html",
        changeOrigin: true,
        secure: false,
      },
      "/main": {
        target: "https://www.onch3.co.kr",
        changeOrigin: true,
        secure: false,
        followRedirects: true,
      },
      "/login": {
        target:
          "https://login.onch3.co.kr/on_auth/login_onch/KOR/aHR0cHM6Ly93d3cub25jaDMuY28ua3Iv",
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: "https://www.onch3.co.kr/__main/across_auth.php",
        changeOrigin: true,
        secure: false,
      },
      "/img": {
        target: "https://image.onch3.co.kr/img_data",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/img/, ""),
      },
    },
  },
});
