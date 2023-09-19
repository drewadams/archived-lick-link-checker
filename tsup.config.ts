import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/"],
	sourcemap: true,
	clean: true,
	outDir: "bin",
	format: ["cjs"],
	dts: true,
});
