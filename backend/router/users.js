const userController = require("../controllers/users");
const isAuth = require("../middlewares/isAuth");

const router = require("express").Router();

// M2 1 + 2 + 3 + 4 + 5
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/profile", isAuth, userController.getUserProfile);
router.put("/profile", isAuth, userController.updateUserProfile);
router.put("/password", isAuth, userController.changeUserPassword);
// M5 2 + 3
router.get("/credit-package", isAuth, userController.getUserCreditPackages);
router.get("/courses", isAuth, userController.getUserCourses);

module.exports = router;