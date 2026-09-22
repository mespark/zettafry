import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    tailwindcss(),
    nitroV2Plugin({ preset: "vercel" }),
  ],
});
