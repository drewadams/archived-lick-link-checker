import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/lib/functions.ts"],
	sourcemap: true,
	clean: true,
	outDir: "bin",
	format: ["cjs"],
	dts: true,
});
