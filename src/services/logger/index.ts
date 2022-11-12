import consola from "consola";

const createLogger = ({ silent }: { silent: boolean }) => {
  return {
    debug: (msg: string, ...args: any) => {
      if (silent) {
        return;
      }

      consola.debug(msg, ...args);
    },
    info: (msg: string, ...args: any) => {
      if (silent) {
        return;
      }

      consola.info(msg, ...args);
    },
    warn: (msg: string, ...args: any) => {
      if (silent) {
        return;
      }

      consola.warn(msg, ...args);
    },
    error: (err: Error, msg: string, ...args: any) => {
      if (silent) {
        return;
      }

      consola.error(err, msg, ...args);
    },
    success: (msg: string, ...args: any) => {
      if (silent) {
        return;
      }

      consola.success(msg, ...args);
    },
  };
};

type Logger = ReturnType<typeof createLogger>;

export { createLogger, Logger };
