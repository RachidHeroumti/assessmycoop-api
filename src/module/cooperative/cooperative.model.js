import { DataTypes } from "sequelize";
import { sequelize } from "../../config/db.js";

const Cooperative = sequelize.define("Cooperative", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  founded: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  founder: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  tableName: "cooperatives",
});

export default Cooperative;

