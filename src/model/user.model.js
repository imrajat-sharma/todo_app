const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: [2, "Your name is too small."],
      maxlength: [16, "Name shouldn't be more than 16 character"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      unique: [true, "Username already exist"],
      match: [/^[a-zA-Z0-9_-]{3,16}$/, "Please fill a valid username"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exist"],
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profileImage: {          
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(this.password, salt);
    this.password = hash;
 
  } catch (err) {
    throw new Error("Error hashing the password");
  }
});



userSchema.methods.comparePassword = async function(plainPassword) {
    return await bcryptjs.compare(plainPassword,this.password)
}

const User = mongoose.model('User',userSchema);

module.exports = User;