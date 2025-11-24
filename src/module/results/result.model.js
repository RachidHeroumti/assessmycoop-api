import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

// Result model (stores all answers for a cooperative)
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

    // Array of answers [{ qid, category, value }]
    answers: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    // optional computed fields
    overallScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    scoresByCategory: {
      type: DataTypes.JSON, // { "Diagnostic Marketing Digital": 3.4, ... }
      allowNull: true,
    },

    interpretation: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    recommendations: {
      type: DataTypes.JSON, // array of strings
      allowNull: true,
    }
  },
  {
    timestamps: true,
    tableName: "results",
  }
);

export { Result };
