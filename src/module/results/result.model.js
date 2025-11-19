import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

// Question model
const Question = sequelize.define(
  "Question",
  {
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    answer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "questions",
  }
);

// Result model with JSON array of questions
const Result = sequelize.define(
  "Result",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cooperativeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questions: {
      type: DataTypes.JSON, // <-- array of Question objects
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "results",
  }
);

export { Question, Result };
