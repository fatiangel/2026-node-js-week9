const userController = require("../controllers/users");
const isAuth = require("../middlewares/isAuth");

const router = require("express").Router();

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/profile", isAuth, userController.getProfile);
router.put("/profile", isAuth, userController.updateProfile);
router.put("/password", isAuth, userController.changePassword);

module.exports = router;