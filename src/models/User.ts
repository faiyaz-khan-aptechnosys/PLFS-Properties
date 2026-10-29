
import mongoose, { Schema, Model } from "mongoose";

export type UserRole = "admin" | "user" | "agent";
export type UserStatus = "active" | "suspended";
export type AgentApprovalStatus =
  | "not_applicable"
  | "pending"
  | "approved"
  | "rejected";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  agentApprovalStatus: AgentApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email"],
    },

    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "user", "agent"],
      default: "user",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      required: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    agentApprovalStatus: {
      type: String,
      enum: ["not_applicable", "pending", "approved", "rejected"],
      default: "not_applicable",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ role: 1, status: 1 });

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);

export default User;
