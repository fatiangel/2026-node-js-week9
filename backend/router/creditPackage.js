const creditPackageController = require("../controllers/credit-package");

const router = require("express").Router();

router.get("/", creditPackageController.getAllCreditPackages);
router.post("/", creditPackageController.postCreditPackage);
router.delete("/:creditPackageId", creditPackageController.deleteCreditPackage);

module.exports = router;