import User from '../models/userModel.js';
import Session from '../models/sessionModel.js';

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
          deleteAccount(element) 
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

      const user = new User({ username: username, fullName: fullName, email: email, password: password, type: type });
      await user.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const {id, user} = req.body;
      const updateUser = await User.findByIdAndUpdate(id, user, {
        new: true,
        runValidators: true,
      }).select('-password');

      if (!updateUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found.'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully.',
        updateUser
      });
    } catch (error) {
      res.status(404).json({
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
