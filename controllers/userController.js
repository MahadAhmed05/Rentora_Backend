// const User = require("../models/User");
// const bcrypt = require("bcryptjs");

// // GET USER
// const getUserController = async (req, res) => {
//   try {
//     // find user
//     const user = await User.findById(req.user._id);
//     // validation
//     if (!user) {
//       return res.status(404).send({
//         success: false,
//         message: "User not found",
//       });
//     }
//     // Hide password
//     user.password = undefined;
//     // resp
//     res.status(200).send({
//       success: true,
//       message: "User get successfully",
//       user,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: "Error in Get User Api",
//       error,
//     });
//   }
// };

// // UPDATE USER
// const updateUserController = async (req, res) => {
//   try {
//     // Find User
//     const user = await User.findById(req.user._id);
//     // Validation
//     if (!user) {
//       return res.status(404).send({
//         success: false,
//         message: "User Not Found",
//       });
//     }
//     // Update
//     const { userName, address, phone } = req.body;
//     if (userName) user.userName = userName;
//     if (address) user.address = address;
//     if (phone) user.phone = phone;
//     // Save User
//     await user.save();
//     res.status(200).send({
//       success: true,
//       message: "User Updated Successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: "Error in Update User Api",
//     });
//   }
// };

// // UPDATE USER PASSWORD
// const updatePasswordController = async (req, res) => {
//   try {
//     // Find User
//     const user = await User.findById(req.user._id);
//     // Validation
//     if (!user) {
//       return res.status(404).send({
//         success: false,
//         message: "User Not Found",
//       });
//     }
//     // GET DATA FROM USER
//     const { oldPassword, newPassword } = req.body;
//     if (!oldPassword || !newPassword) {
//       return res.status(500).send({
//         success: false,
//         message: "Please provide Old and New Password Both",
//       });
//     }

//     // Check User Password and Old Password| Compare password
//     const isMatch = await bcrypt.compare(oldPassword, user.password);
//     if (!isMatch) {
//       return res.status(500).send({
//         success: false,
//         message: "Invalid Old Password",
//       });
//     }

//     // Hasing Password
//     const salt = bcrypt.genSaltSync(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);
//     user.password = hashedPassword;

//     await user.save();
//     res.status(200).send({
//       success: true,
//       message: "Password Updated Successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: "Error in Password Update Api",
//     });
//   }
// };

// // RESET USER PASSWORD
// const resetPasswordController = async (req, res) => {
//   try {
//     const { email, newPassword, answer } = req.body;
//     if (!email || !newPassword || !answer) {
//       return res.status(500).send({
//         success: false,
//         message: "Please complete all fields",
//       });
//     }
//     const user = await User.findOne({ email, answer });
//     if (!user) {
//       return res.status(500).send({
//         success: false,
//         message: "User not found or Wrong answer",
//       });
//     }
//     // Hasing Password
//     const salt = bcrypt.genSaltSync(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);
//     user.password = hashedPassword;
//     await user.save();
//     res.status(200).send({
//       success: true,
//       message: "Password Reset Successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: "Error in Password Reset Api",
//     });
//   }
// };

// // DELETE USER
// const deleteUserController = async (req, res) => {
//   try {
//     await User.findByIdAndDelete(req.params.id);
//     return res.status(200).send({
//       success: true,
//       message: "Your Account has been Deleted Successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: "Error in Delete User Api",
//     });
//   }
// };

// module.exports = {
//   getUserController,
//   updateUserController,
//   updatePasswordController,
//   resetPasswordController,
//   deleteUserController,
// };



const User = require("../models/User");

// GET USER BY ID
const getUserByIdController = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Get User By Id API",
    });
  }
};

module.exports = { getUserByIdController };