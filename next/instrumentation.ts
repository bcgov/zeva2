export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const imports = await import("./instrumentation-node");
    await imports.createBucket();
  }
}
