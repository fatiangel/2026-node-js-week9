const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("./config/index");
const { dataSource } = require("./db/data-source");
const appError = require("./utils/appError");
const skill = require("./router/skill");
const creditPackage = require("./router/credit-package");

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/api/coaches/skill", skill);
app.use("/api/credit-package", creditPackage);


// API
app.get("/healthcheck", async (req, res, next) => {
    try {
        await dataSource.query("SELECT 1"); // 執行簡單的 SQL 查詢，檢查資料庫連線是否正常 
        res.status(200).send("OK");
    } catch (error) {
        res.status(503).send("Service Unavailable");
        console.error(error);
        // next(error);
    }
});

app.use((req, res, next) => {
    // 這裡可以放置中間件或路由
/*     res.status(404).json({ 
        status: 404, 
        message: "找不到路由",
    }); */
    // new Error("找不到路由");
    next(appError(404, "找不到路由"));
    return;
});

app.use((err, req, res, next) => {
    // 這裡可以放置中間件或路由
    const statusCode = err.status || 500; // 500 / 401 / 409
    res.status(statusCode).json({ 
        status: statusCode === 500 ? "error" : "failed", 
        message: err.message || "伺服器錯誤!",
    });
    return;
});

dataSource.initialize().then(() => {
    console.log("資料庫連線成功！");
    app.listen(config.get("web.port"), () => {
        console.log(`Server is running on port ${config.get("web.port")}`);
    });
}).catch((err) => {
    console.error("資料庫連線失敗:", err);
    process.exit(1);
});