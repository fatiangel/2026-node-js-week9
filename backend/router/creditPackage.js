const creditPackageController = require("../controllers/creditPackage");
const isAuth = require("../middlewares/isAuth");

const router = require("express").Router();

// M1 4
router.get("/", creditPackageController.getCreditPackages);
// M1 5
router.post("/", creditPackageController.postCreditPackage);
// M5 1
router.post("/:creditPackageId", isAuth, creditPackageController.postCreditPackageId);
// M1 6
router.delete("/:creditPackageId", creditPackageController.deleteCreditPackageId);

module.exports = router;