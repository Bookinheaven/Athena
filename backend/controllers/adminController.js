import User from '../models/userModel.js';
import Session from '../models/sessionModel.js';
import Streak from '../models/streakModel.js';

class adminController {
  
  static async getUsers(req, res) {
    try {
      const users = await User.find().select('-password');
      res.json({
        success: true,
        users
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  static async removeUsers(req, res) {
    let errors = []
    async function deleteAccount(id) {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        errors.push({
          id: id,
          message: 'User not found.'
        });
      }
    }
    try {
      let list = req.body.data
      if (Array.isArray(list) && list.length > 0) {
        for (let element of list) {
          await deleteAccount(element) 
        }
      }
      if (errors.length > 0) {
        return res.status(400).json(
          {
            success: false,
            message: `Failed users: ${errors.join(" ")}`
          }
        )
      }
      res.json({
        success: true,
        message: 'Users removed successfully.',
        
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  static async addUsers(req, res) {
    try {
      const { username, fullName, email, password, type } = req.body;
      
      const existingEmail = await User.findOne({ email });
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists.'
        });
      }

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already used.'
        });
      }

      const user = new User({
        username: username,
        usernameLower: username.toLowerCase(),
        fullName: fullName,
        email: email,
        password: password,
        type: type,
        isEmailVerified: true
      });
      await user.save();

      await Streak.create({
        userId: user._id
      });

      const userObj = user.toObject();
      delete userObj.password;

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: userObj
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id, user } = req.body;
      if (!id || !user || typeof user !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Invalid user update payload.'
        });
      }

      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      // Whitelist intended updatable fields
      if (user.username !== undefined) {
        existingUser.username = user.username;
        existingUser.usernameLower = user.username.toLowerCase();
      }
      if (user.fullName !== undefined) {
        existingUser.fullName = user.fullName;
      }
      if (user.email !== undefined) {
        existingUser.email = user.email.toLowerCase();
      }
      if (user.type !== undefined) {
        existingUser.type = user.type;
      }
      if (user.isActive !== undefined) {
        existingUser.isActive = Boolean(user.isActive);
      }
      if (user.isEmailVerified !== undefined) {
        existingUser.isEmailVerified = Boolean(user.isEmailVerified);
      }
      // Explicitly handle password updates through existing pre-save bcrypt mechanism
      if (user.password) {
        existingUser.password = user.password;
      }

      await existingUser.save();

      const userObj = existingUser.toObject();
      delete userObj.password;

      res.json({
        success: true,
        message: 'User updated successfully.',
        updateUser: userObj
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getSessions (req, res) {
    try {
        const sessions = await Session.find().select('-password');
        res.status(200).json({success: true, sessions});
      } catch (error) {
        console.error("Error in getSessions:", error);
        res
          .status(500)
          .json({
            message: "Server error while fetching session.",
            error: error.message,
          });
      }
  }

}

export default adminController;
