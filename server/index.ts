import { createApp, log } from "./app";
import { UPLOADS_DIR } from "./local-storage";

(async () => {
  const { httpServer } = await createApp();

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
      log(`uploads directory: ${UPLOADS_DIR}`);
    },
  );
})();
