// const express = require("express");
// const router = express.Router();
// const authMiddleware = require("../middleware/authMiddleware");
// const {
//   getUserController,
//   updateUserController,
//   updatePasswordController,
//   resetPasswordController,
//   deleteUserController,
// } = require("../controllers/userController");

// // Routes
// // GET USER  || GET
// router.get("/getUser", authMiddleware, getUserController);

// // UPDATE USER || PUT
// router.put("/updateUser", authMiddleware, updateUserController);

// // UPDATE PASSWORD
// router.post("/updatePassword", authMiddleware, updatePasswordController);

// // RESET PASSWORD
// router.post("/resetPassword", authMiddleware, resetPasswordController);

// // DELETE USER
// router.delete("/deleteUser/:id", authMiddleware, deleteUserController);

// module.exports = router;


const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getUserByIdController } = require("../controllers/userController");

router.get("/:id", authMiddleware, getUserByIdController);

module.exports = router;