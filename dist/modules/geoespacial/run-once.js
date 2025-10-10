"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../../db/data-source");
const firms_service_1 = require("./services/firms.service");
(async () => {
    if (!data_source_1.AppDataSource.isInitialized)
        await data_source_1.AppDataSource.initialize();
    const r = await (0, firms_service_1.runFirmsIngest)();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(r));
    process.exit(0);
})();
